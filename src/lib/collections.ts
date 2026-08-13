import { supabase } from "@/integrations/supabase/client";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
};

export async function fetchMyCollections(userId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, cover_url, is_public, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function fetchCollectionPostIds(collectionId: string) {
  const { data, error } = await supabase
    .from("collection_items")
    .select("post_id, added_at")
    .eq("collection_id", collectionId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.post_id as string);
}

export async function createCollection(userId: string, name: string, isPublic = false) {
  const { data, error } = await supabase
    .from("collections")
    .insert({ owner_id: userId, name, is_public: isPublic })
    .select("id, name, description, cover_url, is_public, created_at")
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function fetchPostCollections(userId: string, postId: string) {
  const { data, error } = await supabase
    .from("collection_items")
    .select("collection_id, collections!inner(owner_id)")
    .eq("post_id", postId)
    .eq("collections.owner_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.collection_id as string));
}

export async function addToCollection(collectionId: string, postId: string) {
  const { error } = await supabase
    .from("collection_items")
    .upsert({ collection_id: collectionId, post_id: postId }, { onConflict: "collection_id,post_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFromCollection(collectionId: string, postId: string) {
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("post_id", postId);
  if (error) throw error;
}

export async function deleteCollection(collectionId: string) {
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);
  if (error) throw error;
}