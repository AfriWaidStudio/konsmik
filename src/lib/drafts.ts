import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDraft(userId: string | undefined, kind: "post" | "comment" | "message", targetId?: string) {
  const [body, setBody] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const loaded = useRef(false);

  // Load existing draft once
  useEffect(() => {
    if (!userId || loaded.current) return;
    loaded.current = true;
    let q = supabase.from("drafts").select("id, body").eq("user_id", userId).eq("kind", kind);
    if (targetId) q = q.eq("target_id", targetId);
    else q = q.is("target_id", null);
    q.order("updated_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) { setDraftId(data.id); setBody(data.body ?? ""); }
    });
  }, [userId, kind, targetId]);

  // Debounced autosave
  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(async () => {
      if (!body.trim() && !draftId) return;
      if (draftId) {
        await supabase.from("drafts").update({ body, updated_at: new Date().toISOString() }).eq("id", draftId);
      } else if (body.trim()) {
        const { data } = await supabase
          .from("drafts")
          .insert({ user_id: userId, kind, target_id: targetId ?? null, body })
          .select("id").single();
        if (data) setDraftId(data.id);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [body, userId, kind, targetId, draftId]);

  const clear = async () => {
    if (draftId) {
      await supabase.from("drafts").delete().eq("id", draftId);
      setDraftId(null);
    }
    setBody("");
  };

  return { body, setBody, clear, draftId };
}