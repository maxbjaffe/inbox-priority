import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTodoistTask } from "@/lib/todoist";
import type { TodoistTask } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: TodoistTask = await request.json();
    const result = await createTodoistTask(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating Todoist task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
