import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const seenThisSession = new Set<string>();

/**
 * Counts one view per post per session once at least half of the card
 * has been visible for a moment. Returns a ref to attach and the live count.
 */
export function useViewTracker(postId: string | undefined, initial = 0) {
  const ref = useRef<HTMLElement | null>(null);
  const [views, setViews] = useState(initial);

  useEffect(() => setViews(initial), [initial]);

  useEffect(() => {
    const el = ref.current;
    if (!postId || !el || seenThisSession.has(postId)) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          timer = setTimeout(() => {
            if (seenThisSession.has(postId)) return;
            seenThisSession.add(postId);
            setViews((v) => v + 1);
            supabase.rpc("increment_post_view", { _post_id: postId });
            io.disconnect();
          }, 900);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, [postId]);

  return { ref, views };
}
