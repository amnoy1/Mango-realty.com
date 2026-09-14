import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isFullAdmin } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await (searchParams ?? Promise.resolve({} as { tab?: string }));
  const initialTab = params.tab ?? "properties";

  const supabase = await createAdminClient();
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  const fullAdmin = isFullAdmin(user?.email);

  // Fetch only the table(s) the active tab actually needs. Previously every tab
  // switch (a plain ?tab= navigation on this force-dynamic-by-cookies page) re-ran
  // all six queries below regardless of which tab was requested — clicking
  // "שכונות" still re-fetched the full properties list and the whatsapp_properties
  // table. That's what made switching tabs feel slow.

  // Agent (non-full-admin): only "properties" (their own) and "leads" tabs exist.
  if (!fullAdmin) {
    const { data: agentRecord } = await supabase
      .from("agents")
      .select("id, first_name, last_name")
      .eq("email", user?.email ?? "")
      .maybeSingle();

    const agentName = agentRecord
      ? `${agentRecord.first_name} ${agentRecord.last_name}`
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let myProperties: any = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sellerLeads: any = [];

    if (initialTab === "leads") {
      ({ data: sellerLeads } = await supabase
        .from("seller_leads")
        .select("id, name, phone, city, property_type, notes, created_at")
        .order("created_at", { ascending: false }));
    } else if (agentRecord) {
      ({ data: myProperties } = await supabase
        .from("properties")
        .select("id, slug, title, price, city, status, images, features")
        .eq("agent_id", agentRecord.id)
        .order("created_at", { ascending: false }));
    }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let properties: any = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let agents: any = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let neighborhoods: any = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sellerLeads: any = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whatsAppProperties: any = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let streetNeighborhoods: any = [];

  switch (initialTab) {
    case "agents":
      ({ data: agents } = await supabase
        .from("agents")
        .select("id, slug, first_name, last_name, phone, email, photo_url")
        .order("first_name"));
      break;
    case "neighborhoods":
      ({ data: neighborhoods } = await supabase
        .from("neighborhoods")
        .select("id, city, neighborhood, description, transport, socioeconomic, commerce, schools, image_url, analysis_updated_at")
        .order("city"));
      break;
    case "leads":
      ({ data: sellerLeads } = await supabase
        .from("seller_leads")
        .select("id, name, phone, city, property_type, notes, created_at")
        .order("created_at", { ascending: false }));
      break;
    case "whatsapp":
      ({ data: whatsAppProperties } = await supabase
        .from("whatsapp_properties")
        .select("id, property_type, address, city, neighborhood, area_sqm, balcony_sqm, rooms, floor, price, previous_price, mamad, parking, storage, elevator, broker_name, broker_phone, first_seen_date, last_seen_date, updated_at")
        .order("last_seen_date", { ascending: false }));
      break;
    case "street-map":
      ({ data: streetNeighborhoods } = await supabase
        .from("street_neighborhoods")
        .select("id, city, street, neighborhood, created_at")
        .order("city").order("street"));
      break;
    case "properties":
    default:
      ({ data: properties } = await supabase
        .from("properties")
        .select("id, slug, title, price, city, status, images, features")
        .order("created_at", { ascending: false }));
      break;
  }

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
