Written for: whoever deploys the clearance list, including future you.

# The clearance sheet

`Code.gs` is the durable store behind `GOOGLE_SHEETS_WEBAPP_URL`. Without it
the site falls back to `data/allowlist.json`, which works locally and loses
everything in production — a serverless filesystem is read-only, and anything
written there disappears with the instance.

## Deploying it

1. Create a new spreadsheet at [sheets.new](https://sheets.new). Name it
   something you will recognise in six months.
2. **From inside that sheet**, open **Extensions → Apps Script**. Delete
   whatever is in `Code.gs` and paste this file in its place.

   Starting from `script.new` instead makes a *standalone* script with no
   sheet attached, and every write fails with "unable to open the file at
   present" while `?version` keeps answering — a confusing pair of symptoms.
   If you have already done that, set `SPREADSHEET_ID` at the top of the
   file to the long id in your sheet's URL rather than starting over.
3. **Deploy → New deployment**, gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise it when asked. The warning screen is Google's standard one for
   an unverified script; **Advanced → Go to (project name)** is the way
   through.
5. Copy the `/exec` URL and set it as `GOOGLE_SHEETS_WEBAPP_URL` in the
   site's environment.

The `Clearance` tab and its header row are created on the first submission,
so there is no sheet to set up by hand.

## Checking it is live

```bash
curl "<your /exec url>"            # -> {"count":0}
curl "<your /exec url>?version"    # -> {"version":3}
```

Both have to answer JSON. If `?version` works and the bare call returns
HTML, the script is not attached to a spreadsheet — see step 2.

`?version` exists because **Apps Script keeps serving the old copy until a
deployment is updated**, and nothing in the editor says so. If the version
does not match `SCRIPT_VERSION` in this file, the paste landed but the
deployment did not: **Deploy → Manage deployments → edit → Version: New**.

## Before the list opens

- `CAP` is `0`, meaning no limit. Set it to the real number if there is a
  hard cap on spots. It is enforced inside the write lock, so the cap+1'th
  entry cannot exist even if requests arrive together.
- `SHARED_SECRET` is empty. The web app is deployed public, so anyone with
  the URL can POST to it. Setting a secret here and as `SHEET_SECRET` in the
  site's env closes that; leaving it open is a reasonable call while the URL
  is only in server-side environment variables.
- Delete any test rows so the counter starts at 0.

## Why "Anyone" and not "Anyone with Google account"

The site calls this from its server with no user signed in. "Anyone with
Google account" makes every request a redirect to a login page, and the
submission fails with an HTML response the site cannot parse.

## If submissions stop landing

Most likely, in order:

1. **A deployment was not updated.** Check `?version`.
2. **The URL is the `/dev` one.** `/dev` only works while signed in as the
   owner; the site needs `/exec`.
3. **The script hit an error.** Apps Script → **Executions** shows every run
   and its failure.
