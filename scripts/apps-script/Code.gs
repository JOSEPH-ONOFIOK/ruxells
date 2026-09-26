/**
 * RUXXELLS clearance list — Google Apps Script web app.
 *
 * The durable store behind GOOGLE_SHEETS_WEBAPP_URL. A serverless filesystem
 * is read-only in production, so the local data/allowlist.json fallback only
 * works in development; deployed, every submission lands here.
 *
 * Contract with src/lib/allowlist-store.ts:
 *
 *   GET  ->  { count: number }
 *   POST {handle, wallet, xUserId, quoteLink, inviteCode, referredBy}
 *        ->  { position: number }       on success
 *        ->  { error: "duplicate" }     wallet already listed
 *        ->  { error: "duplicate_x" }   X account already listed
 *        ->  { error: "capped" }        the list is full
 *        ->  { error: "<message>" }     anything else; the site treats an
 *                                       unrecognised error as a 502
 *
 * `inviteCode` is the wire name for what the site calls a clearance code.
 * Renaming it here would mean changing the site to match, so it stays.
 *
 * Setup is in README.md next to this file.
 */

/**
 * Bumped whenever this file changes.
 *
 * `?version` returns it, so a deployment can be checked against the repo
 * rather than guessed at from behaviour — Apps Script silently keeps serving
 * the old copy if a deployment is not updated, and that is very hard to spot.
 */
var SCRIPT_VERSION = 3;

/** Tab the entries live on. Created on first write if missing. */
var SHEET_NAME = 'Clearance';

/**
 * The spreadsheet to write to, by id, or '' when this script is bound to one.
 *
 * A script created from Extensions → Apps Script inside a sheet is bound to
 * it and getActiveSpreadsheet() finds it. A standalone script — one made at
 * script.new — has no active spreadsheet, and every sheet call fails with
 * "unable to open the file at present" while ?version keeps working, because
 * that path returns before touching the sheet. It is a confusing failure to
 * read, so this exists.
 *
 * The id is the long string in the sheet's URL:
 *   docs.google.com/spreadsheets/d/<THIS PART>/edit
 */
var SPREADSHEET_ID = '';

/**
 * How many spots exist, or 0 for no limit.
 *
 * Supply is still TBA, so this is off. Set it to the real number before the
 * list opens if there is a hard cap: the check runs inside the write lock, so
 * the cap+1'th entry cannot exist even under load.
 */
var CAP = 0;

/**
 * Optional shared secret.
 *
 * A web app deployed "anyone, even anonymous" is a URL anybody can POST to,
 * and the URL is in the site's server environment rather than its client
 * bundle — but it only takes one leak. Set this here and as SHEET_SECRET in
 * the site's env to require it. Left empty, no secret is checked.
 */
var SHARED_SECRET = '';

/**
 * Columns, in order.
 *
 * Rows are built by looking positions up in this list rather than written
 * out positionally, so adding a column here cannot silently shift the data
 * in an existing one.
 */
var HEADERS = [
  'Joined At',
  'Handle',
  'Wallet',
  'Clearance Code',
  'X User ID',
  'Quote Link',
  'Referred By',
];

// --- entry points -----------------------------------------------------

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    // Which copy is deployed.
    if (p.version !== undefined) {
      return json({ version: SCRIPT_VERSION });
    }

    // ?referrals totals how many each code brought in, highest first. The
    // site does not call it yet; it is what a leaderboard reads, and
    // counting rows by hand is how a published number ends up wrong.
    if (p.referrals !== undefined) {
      return json({ referrals: countReferrals() });
    }

    // What the site polls for the "N through the door" counter.
    return json({ count: countEntries() });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  /**
   * One writer at a time.
   *
   * Two submissions arriving together would otherwise both read the same row
   * count, both pass the duplicate check, and the second would land on top of
   * the first. Everything that reads-then-writes happens inside this lock.
   */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ error: 'Busy, try again.' });
  }

  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (SHARED_SECRET && body.secret !== SHARED_SECRET) {
      return json({ error: 'unauthorised' });
    }

    var handle = String(body.handle || '').trim();
    var wallet = String(body.wallet || '').trim();
    var code = String(body.inviteCode || '').trim();
    var xUserId = String(body.xUserId || '').trim();
    var quoteLink = String(body.quoteLink || '').trim();
    // Already validated site-side against the alphabet it was generated
    // from; empty when nobody referred them.
    var referredBy = String(body.referredBy || '').trim();

    if (!handle || !wallet || !code) {
      return json({ error: 'Missing handle, wallet or clearance code.' });
    }

    var sheet = getSheet();
    var rows = sheet.getLastRow() - 1; // minus the header row

    /**
     * The cap, enforced here rather than by the caller.
     *
     * The site could check it, but a check over the network is read-then-write
     * with a gap in between: under load every request reads the same count and
     * every one proceeds. Inside this lock the count is the count.
     */
    if (CAP > 0 && rows >= CAP) {
      return json({ error: 'capped' });
    }

    if (rows > 0) {
      /**
       * Both key columns in one read.
       *
       * Fetching the whole sheet per submission is the slow path that
       * eventually times Apps Script out. The columns are looked up by header
       * rather than hard-coded, so reordering the sheet cannot point the
       * duplicate check at the wrong data.
       */
      var walletCol = HEADERS.indexOf('Wallet') + 1;
      var xIdCol = HEADERS.indexOf('X User ID') + 1;
      var first = Math.min(walletCol, xIdCol);
      var width = Math.abs(xIdCol - walletCol) + 1;

      var values = sheet.getRange(2, first, rows, width).getValues();
      var walletAt = walletCol - first;
      var xIdAt = xIdCol - first;

      for (var i = 0; i < values.length; i++) {
        var rowWallet = String(values[i][walletAt] || '').trim();
        var rowXId = String(values[i][xIdAt] || '').trim();

        // Addresses are compared lowercased: the same wallet in checksummed
        // and plain form is the same wallet, and letting both through would
        // give one person two spots.
        if (rowWallet.toLowerCase() === wallet.toLowerCase()) {
          return json({ error: 'duplicate' });
        }
        if (xUserId && rowXId === xUserId) {
          return json({ error: 'duplicate_x' });
        }
      }
    }

    var row = [];
    row[HEADERS.indexOf('Joined At')] = new Date().toISOString();
    row[HEADERS.indexOf('Handle')] = handle;
    row[HEADERS.indexOf('Wallet')] = wallet;
    row[HEADERS.indexOf('Clearance Code')] = code;
    row[HEADERS.indexOf('X User ID')] = xUserId;
    row[HEADERS.indexOf('Quote Link')] = quoteLink;
    row[HEADERS.indexOf('Referred By')] = referredBy;
    sheet.appendRow(row);

    // Position is 1-based and counts entries, not spreadsheet rows.
    return json({ position: sheet.getLastRow() - 1 });
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// --- helpers ----------------------------------------------------------

function getSheet() {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error(
      'No spreadsheet. Either bind this script to one (Extensions → Apps ' +
        'Script from inside the sheet) or set SPREADSHEET_ID above.',
    );
  }

  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // A fresh sheet gets its header row on the first write, so there is no
  // setup step that can be forgotten.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function countEntries() {
  var sheet = getSheet();
  return Math.max(0, sheet.getLastRow() - 1);
}

/**
 * How many entries each referral code brought in.
 *
 * One read of the column rather than a query per code: the sheet is small
 * now and this keeps it a single call however large it gets.
 */
function countReferrals() {
  var sheet = getSheet();
  var rows = sheet.getLastRow() - 1;
  if (rows < 1) return {};

  var col = HEADERS.indexOf('Referred By') + 1;
  var values = sheet.getRange(2, col, rows, 1).getValues();
  var out = {};

  for (var i = 0; i < values.length; i++) {
    var code = String(values[i][0] || '').trim();
    if (!code) continue;
    out[code] = (out[code] || 0) + 1;
  }

  return out;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
