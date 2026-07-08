import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

// Client sends: { filenames: string[], slug?: string }
// Returns:      { uploads: { signedUrl: string; path: string; publicUrl: string }[] }
// Client then PUT each file directly to signedUrl (bypasses Vercel 4.5 MB body limit)
export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filenames, slug: rawSlug } = await request.json();

  if (!Array.isArray(filenames) || filenames.length === 0) {
    return NextResponse.json({ error: "No filenames provided" }, { status: 400 });
  }

  const slug = rawSlug || `property-${Date.now()}`;
  const supabase = await createAdminClient();
  const uploads: { signedUrl: string; path: string; publicUrl: string }[] = [];
  const errors: string[] = [];

  for (const name of filenames as string[]) {
    const ext = name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("property-images")
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Failed to create signed URL:", error);
      errors.push(`${name}: ${error?.message ?? "unknown error"}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(path);

    uploads.push({
      signedUrl: data.signedUrl,
      path,
      publicUrl: urlData.publicUrl,
    });
  }

  if (uploads.length === 0) {
    return NextResponse.json(
      { error: errors.length ? errors.join("; ") : "Failed to create upload URLs" },
      { status: 500 }
    );
  }

  return NextResponse.json({ uploads, errors: errors.length ? errors : undefined });
}
