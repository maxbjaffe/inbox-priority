import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmailList from "@/components/EmailList";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <EmailList />;
}
