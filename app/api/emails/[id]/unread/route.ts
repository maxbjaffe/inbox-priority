import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markEmailAsUnread } from "@/lib/gmail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await markEmailAsUnread(session.accessToken, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking email as unread:", error);
    return NextResponse.json(
      { error: "Failed to mark email as unread" },
      { status: 500 }
    );
  }
}
