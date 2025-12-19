import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { archiveEmail } from "@/lib/gmail";

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
    await archiveEmail(session.accessToken, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving email:", error);
    return NextResponse.json(
      { error: "Failed to archive email" },
      { status: 500 }
    );
  }
}
