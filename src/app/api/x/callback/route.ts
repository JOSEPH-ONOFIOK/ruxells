import { NextRequest, NextResponse } from "next/server";
import {
  STATE_COOKIE,
  VERIFIER_COOKIE,
  exchangeCode,
  fetchMe,
  xConfig,
} from "@/lib/x-oauth";
import {
  SESSION_COOKIE,
  cookieOptions,
  serializeAccount,
} from "@/lib/x-session";

function back(origin: string, status: string) {
  return NextResponse.redirect(new URL(`/clearance?x=${status}`, origin));
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const config = xConfig(origin);
  if (!config) return back(origin, "unconfigured");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return back(origin, "denied");

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  const verifier = req.cookies.get(VERIFIER_COOKIE)?.value;

  if (
    !code ||
    !state ||
    !expectedState ||
    !verifier ||
    state !== expectedState
  ) {
    return back(origin, "badstate");
  }

  try {
    const token = await exchangeCode(config, code, verifier);
    const user = await fetchMe(token);

    const res = back(origin, "connected");
    res.cookies.set(
      SESSION_COOKIE,
      serializeAccount({
        id: user.id,
        username: user.username,
        name: user.name,
      }),
      cookieOptions,
    );
    // The access token is deliberately not kept: identity is all this flow
    // needs, so there is nothing worth stealing left behind.
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(VERIFIER_COOKIE);
    return res;
  } catch (err) {
    /**
     * The visitor gets "try again"; the log gets the reason.
     *
     * Swallowing this entirely made a wrong client secret, an unregistered
     * callback and X being down all look identical from the outside — and
     * they need different fixes. The message is X's own status line, which
     * carries no token: the code is already spent and the secret is never
     * in the thrown error.
     */
    console.error("[x/callback]", err instanceof Error ? err.message : err);
    return back(origin, "failed");
  }
}
