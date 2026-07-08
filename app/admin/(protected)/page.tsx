import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isFullAdmin } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createAdminClient();
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const fullAdmin = isFullAdmin(user?.email);

  const [{ data: properties }, { data: agents }, { data: neighborhoods }, { data: sellerLeads }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, slug, title, price, city, status, images, features")
      .order("created_at", { ascending: false }),
    supabase
      .from("agents")
      .select("id, slug, first_name, last_name, phone, email, photo_url")
      .order("first_name"),
    supabase
      .from("neighborhoods")
      .select("id, city, neighborhood, description, transport, socioeconomic, commerce, schools, image_url, analysis_updated_at")
      .order("city"),
    supabase
      .from("seller_leads")
      .select("id, name, phone, city, property_type, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminDashboard
      properties={properties ?? []}
      agents={agents ?? []}
      neighborhoods={neighborhoods ?? []}
      sellerLeads={sellerLeads ?? []}
      isFullAdmin={fullAdmin}
    />
  );
}
