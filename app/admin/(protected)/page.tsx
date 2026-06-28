import { createAdminClient } from "@/lib/supabase/server";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createAdminClient();

  const [{ data: properties }, { data: agents }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, slug, title, price, city, status, images")
      .order("created_at", { ascending: false }),
    supabase
      .from("agents")
      .select("id, slug, first_name, last_name, phone, email, photo_url")
      .order("first_name"),
  ]);

  return <AdminDashboard properties={properties ?? []} agents={agents ?? []} />;
}
