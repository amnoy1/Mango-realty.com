import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const slug = (formData.get("slug") as string) || `property-${Date.now()}`;

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);

    urls.push(urlData.publicUrl);
  }

  return NextResponse.json({ urls });
}
