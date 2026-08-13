import { supabase } from "@/integrations/supabase/client";

export async function uploadToMedia(file: File, userId: string, folder = "uploads") {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
