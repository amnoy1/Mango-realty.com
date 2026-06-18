import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeletePropertyButton from "./DeletePropertyButton";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = await createAdminClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, slug, title, price, city, status, images, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-600">שגיאה בטעינת נכסים: {error.message}</p>;
  }

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active:  { label: "פעיל",    color: "bg-green-100 text-green-700" },
    draft:   { label: "טיוטה",  color: "bg-yellow-100 text-yellow-700" },
    sold:    { label: "נמכר",    color: "bg-gray-100 text-gray-600" },
    rented:  { label: "הושכר",  color: "bg-blue-100 text-blue-700" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">נכסים</h1>
          <p className="text-sm text-gray-500 mt-0.5">{properties?.length || 0} נכסים במערכת</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="bg-[#F5A623] hover:bg-[#D4881A] text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          נכס חדש
        </Link>
      </div>

      {!properties?.length ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-lg">אין נכסים עדיין</p>
          <Link href="/admin/properties/new" className="mt-4 inline-block text-[#F5A623] hover:underline text-sm">
            הוסף נכס ראשון →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right font-medium text-gray-500 px-4 py-3 w-16">תמונה</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">נכס</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">מחיר</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">עיר</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">סטטוס</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((p) => {
                const thumb = p.images?.[0];
                const status = STATUS_LABELS[p.status] || STATUS_LABELS.draft;
                const price = p.price
                  ? `₪${Number(p.price).toLocaleString("he-IL")}`
                  : "—";

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.title}
                          className="w-14 h-10 object-cover rounded-lg bg-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 line-clamp-1">{p.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{price}</td>
                    <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/properties/${p.id}/edit`}
                          className="text-gray-500 hover:text-[#F5A623] transition-colors"
                          title="עריכה"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {p.slug && (
                          <Link
                            href={`/properties/${p.slug}`}
                            target="_blank"
                            className="text-gray-500 hover:text-blue-500 transition-colors"
                            title="צפה באתר"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        )}
                        <DeletePropertyButton id={p.id} title={p.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
