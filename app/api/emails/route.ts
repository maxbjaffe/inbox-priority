import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchUnreadEmails } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/claude";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const emails = await fetchUnreadEmails(session.accessToken);
    const analyzedEmails = await analyzeEmails(emails);

    return NextResponse.json(analyzedEmails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
