import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * Where submissions go.
 *
 * The Google Sheets web app is the durable store when `GOOGLE_SHEETS_WEBAPP_URL`
 * is set, because a serverless filesystem is read-only in production and
 * anything written to it disappears with the instance. The local JSON file is
 * the no-sheet development fallback.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "allowlist.json");

export type Entry = {
  handle: string;
  wallet: string;
  clearanceCode: string;
  joinedAt: string;
  xUserId?: string;
  quoteLink?: string;
  /** The code of whoever sent them, or empty. */
  referredBy?: string;
};

export type Submission = {
  handle: string;
  wallet: string;
  xUserId: string;
  quoteLink: string;
  referredBy: string;
};

export type SubmitResult =
  | { position: number | null; clearanceCode: string }
  | { error: string };

function newClearanceCode() {
  return `RUX-${randomUUID().split("-")[0].toUpperCase().slice(0, 6)}`;
}

// --- local JSON fallback ---------------------------------------------

async function readLocalEntries(): Promise<Entry[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalEntries(entries: Entry[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

async function submitToLocalFile(sub: Submission): Promise<SubmitResult> {
  const entries = await readLocalEntries();

  if (entries.some((e) => e.wallet.toLowerCase() === sub.wallet.toLowerCase())) {
    return { error: "That wallet is already cleared." };
  }
  if (sub.xUserId && entries.some((e) => e.xUserId === sub.xUserId)) {
    return { error: "That X account is already cleared." };
  }

  const clearanceCode = newClearanceCode();
  entries.push({
    handle: sub.handle,
    wallet: sub.wallet,
    clearanceCode,
    joinedAt: new Date().toISOString(),
    xUserId: sub.xUserId,
    quoteLink: sub.quoteLink,
    referredBy: sub.referredBy,
  });
  await writeLocalEntries(entries);

  return { position: entries.length, clearanceCode };
}

// --- Google Sheets backend -------------------------------------------

async function submitToSheet(
  webAppUrl: string,
  sub: Submission,
): Promise<SubmitResult> {
  const clearanceCode = newClearanceCode();

  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `inviteCode` is the field name the Apps Script writes; the site calls
    // the same value a clearance code. Renaming it here would mean redeploying
    // the script to match, so the wire name stays put.
    body: JSON.stringify({ ...sub, inviteCode: clearanceCode }),
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`Sheets webhook returned ${res.status}`);

  const data = await res.json();

  if (data.error === "capped") {
    return { error: "Every spot is taken." };
  }
  if (data.error === "duplicate") {
    return { error: "That wallet is already cleared." };
  }
  if (data.error === "duplicate_x") {
    return { error: "That X account is already cleared." };
  }
  if (data.error) throw new Error(String(data.error));

  /**
   * The position, when the response actually carried one.
   *
   * Apps Script answers a POST with a 302 to googleusercontent.com, and a
   * redirect turns the follow-up into a GET — so a successful write can come
   * back as this script's GET response, `{count}`, rather than its POST
   * response, `{position}`. Errors are small enough to be returned directly
   * and arrive intact, which is why only the success path is affected.
   *
   * The row is written either way; only the number is missing. Falling back
   * to the count keeps it right, and null rather than NaN means the receipt
   * can leave the line out instead of printing "#NaN".
   */
  const position = Number(data.position ?? data.count);

  return {
    position: Number.isFinite(position) ? position : null,
    clearanceCode,
  };
}

async function countSheetEntries(webAppUrl: string) {
  const res = await fetch(webAppUrl, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error(`Sheets webhook returned ${res.status}`);
  const data = await res.json();
  return Number(data.count ?? 0);
}

// --- public API -------------------------------------------------------

export async function submitEntry(sub: Submission): Promise<SubmitResult> {
  const url = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  return url ? submitToSheet(url, sub) : submitToLocalFile(sub);
}

export async function countEntries(): Promise<number> {
  const url = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  return url ? countSheetEntries(url) : (await readLocalEntries()).length;
}
