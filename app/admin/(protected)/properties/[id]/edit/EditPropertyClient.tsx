"use client";

import PropertyForm from "@/components/admin/PropertyForm";

interface Agent { id: string; first_name: string; last_name: string; }

export default function EditPropertyClient({
  id,
  initialData,
  agents,
}: {
  id: string;
  initialData: Parameters<typeof PropertyForm>[0]["initialData"];
  agents: Agent[];
}) {
  async function handleSubmit(formData: Parameters<React.ComponentProps<typeof PropertyForm>["onSubmit"]>[0]) {
    try {
      const payload = {
        ...formData,
        price:        formData.price        ? Number(formData.price)        : null,
        rooms:        formData.rooms        ? Number(formData.rooms)        : null,
        bathrooms:    formData.bathrooms    ? Number(formData.bathrooms)    : null,
        area_sqm:     formData.area_sqm     ? Number(formData.area_sqm)     : null,
        floor:        formData.floor        ? Number(formData.floor)        : null,
        total_floors: formData.total_floors ? Number(formData.total_floors) : null,
        images:       formData.images.map((img) => img.url),
        agent_id:     formData.agent_id || null,
        updated_at:   new Date().toISOString(),
      };

      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) return { error: json.error || "שגיאה בשמירה" };
      return {};
    } catch {
      return { error: "שגיאה בלתי צפויה" };
    }
  }

  return <PropertyForm initialData={initialData} onSubmit={handleSubmit} agents={agents} />;
}
