import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchUnreadEmails, type DateRange } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/claude";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
      return NextResponse.json(
        { error: "Unauthorized", needsReauth: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") as DateRange) || "today";

    const emails = await fetchUnreadEmails(session.accessToken, range);
    const analyzedEmails = await analyzeEmails(emails);

    return NextResponse.json(analyzedEmails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch emails", details: errorMessage },
      { status: 500 }
    );
  }
}
