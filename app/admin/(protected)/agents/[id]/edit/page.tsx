import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AgentEditClient from "./AgentEditClient";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).single();
  if (!agent) notFound();

  return <AgentEditClient agent={agent} />;
}
