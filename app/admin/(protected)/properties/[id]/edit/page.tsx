import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditPropertyClient from "./EditPropertyClient";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const [{ data: property, error }, { data: agents }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).single(),
    supabase.from("agents").select("id, first_name, last_name").order("first_name"),
  ]);

  if (error || !property) notFound();

  const initialData = {
    id: property.id,
    title: property.title || "",
    slug: property.slug || "",
    price: property.price?.toString() || "",
    price_type: property.price_type || "sale",
    property_type: property.property_type || "apartment",
    status: property.status || "active",
    city: property.city || "",
    neighborhood: property.neighborhood || "",
    street: property.street || "",
    rooms: property.rooms?.toString() || "",
    bathrooms: property.bathrooms?.toString() || "",
    area_sqm: property.area_sqm?.toString() || "",
    floor: property.floor?.toString() || "",
    total_floors: property.total_floors?.toString() || "",
    description: property.description || "",
    features: property.features || {},
    images: (property.images || []).map((url: string, i: number) => ({
      id: `existing-${i}`,
      url,
      name: `image-${i}`,
    })),
    meta_title:       property.meta_title || "",
    meta_description: property.meta_description || "",
    agent_id:         property.agent_id || "",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עריכת נכס</h1>
          <p className="text-sm text-gray-500 mt-0.5 font-mono">{property.slug}</p>
        </div>
      </div>
      <EditPropertyClient id={id} initialData={initialData} agents={agents ?? []} />
    </div>
  );
}
