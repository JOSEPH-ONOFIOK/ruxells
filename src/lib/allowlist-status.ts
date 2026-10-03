import { DROP } from "./sectors";

/**
 * Hard kill-switch for new clearance applications.
 *
 * Flip this to false and redeploy to shut submissions off from source — for
 * when something is wrong and a deploy is the fastest lever available.
 */
export const ALLOWLIST_OPEN = true;

/**
 * Open until the kill-switch is thrown or `DROP.closesAt` passes, whichever
 * comes first.
 *
 * The deadline is checked here, on the server, and not only by the countdown:
 * the countdown is a clock on the page, and a page left open — or a request
 * sent without one — would otherwise keep the door open past it. Every
 * caller renders per request, so this is read at request time, not frozen
 * into a build.
 */
export const signupsOpen = () =>
  ALLOWLIST_OPEN && Date.now() < Date.parse(DROP.closesAt);
