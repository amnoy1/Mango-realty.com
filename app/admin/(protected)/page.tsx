import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isFullAdmin } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await (searchParams ?? Promise.resolve({}));
  const initialTab = params.tab ?? "properties";

  const supabase = await createAdminClient();
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const fullAdmin = isFullAdmin(user?.email);

  // Agent (non-full-admin): show only their own properties + all leads
  if (!fullAdmin) {
    const { data: agentRecord } = await supabase
      .from("agents")
      .select("id, first_name, last_name")
      .eq("email", user?.email ?? "")
      .maybeSingle();

    const [{ data: myProperties }, { data: sellerLeads }] = await Promise.all([
      agentRecord
        ? supabase
            .from("properties")
            .select("id, slug, title, price, city, status, images, features")
            .eq("agent_id", agentRecord.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("seller_leads")
        .select("id, name, phone, city, property_type, notes, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const agentName = agentRecord
      ? `${agentRecord.first_name} ${agentRecord.last_name}`
      : undefined;

    return (
      <AdminDashboard
        properties={myProperties ?? []}
        agents={[]}
        neighborhoods={[]}
        sellerLeads={sellerLeads ?? []}
        whatsAppProperties={[]}
        streetNeighborhoods={[]}
        isFullAdmin={false}
        agentName={agentName}
        initialTab={initialTab}
      />
    );
  }

  const [{ data: properties }, { data: agents }, { data: neighborhoods }, { data: sellerLeads }, { data: whatsAppProperties }, { data: streetNeighborhoods }] = await Promise.all([
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
    supabase
      .from("whatsapp_properties")
      .select("id, property_type, address, city, neighborhood, area_sqm, balcony_sqm, rooms, floor, price, previous_price, mamad, parking, storage, elevator, broker_name, broker_phone, first_seen_date, last_seen_date, updated_at")
      .order("last_seen_date", { ascending: false }),
    supabase
      .from("street_neighborhoods")
      .select("id, city, street, neighborhood, created_at")
      .order("city").order("street"),
  ]);

  return (
    <AdminDashboard
      properties={properties ?? []}
      agents={agents ?? []}
      neighborhoods={neighborhoods ?? []}
      sellerLeads={sellerLeads ?? []}
      whatsAppProperties={whatsAppProperties ?? []}
      streetNeighborhoods={streetNeighborhoods ?? []}
      isFullAdmin={fullAdmin}
      initialTab={initialTab}
    />
  );
}
