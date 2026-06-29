import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { city, neighborhood, fileType } = await request.json() as {
    city: string;
    neighborhood: string;
    fileType: string;
  };

  const ext = fileType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const slug = `${city}-${neighborhood}`.replace(/\s+/g, "-").replace(/[^\w\u0590-\u05ff-]/g, "");
  const path = `neighborhoods/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage
    .from("property-images")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "upload failed" }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`;

  // suppress unused variable warning
  void slug;

  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
