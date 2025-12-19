import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchEmailBody } from "@/lib/gmail";

export async function GET(
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
    const body = await fetchEmailBody(session.accessToken, id);

    return NextResponse.json(body);
  } catch (error) {
    console.error("Error fetching email body:", error);
    return NextResponse.json(
      { error: "Failed to fetch email body" },
      { status: 500 }
    );
  }
}
