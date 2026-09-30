import { NextResponse } from "next/server";
import { standing } from "@/lib/ruxlisted";
import { currentAccount } from "@/lib/x-session";

/**
 * Whether the connected X account is through the door.
 *
 * Takes no input: the account comes from the signed session cookie, so the
 * only thing anyone can ask about is themselves. An unreachable store is a
 * 503 rather than a no — turning away someone who is on the list because
 * the sheet was slow would be the worse mistake.
 */
export async function GET() {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "Connect your X account first." }, { status: 401 });
  }

  try {
    return NextResponse.json({ standing: await standing(account) });
  } catch (err) {
    console.error("[ruxlisted]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The door is not answering. Try again in a moment." },
      { status: 503 },
    );
  }
}
