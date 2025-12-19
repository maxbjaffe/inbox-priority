export interface EmailAnalysis {
  urgency_score: number;
  is_urgent: boolean;
  action_item: string;
  suggested_due: string | null;
  category: "urgent" | "school" | "unsubscribe_candidate" | "normal";
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  analysis?: EmailAnalysis;
}

export interface TodoistTask {
  title: string;
  description: string;
  priority: number;
  due_string?: string;
}
