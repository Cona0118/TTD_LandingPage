import { createClient } from "@supabase/supabase-js";

export async function getContent() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .single();

    if (error) return null;
    return data?.data ?? null;
  } catch {
    return null;
  }
}
