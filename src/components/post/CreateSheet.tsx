import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Sparkles,
  Image as ImageIcon,
  Brain,
  MessageCircle,
  Loader2,
  ChevronLeft,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { createPost } from "@/lib/posts";
import { uploadToMedia } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { listMyPostableSpaces, type PostableSpace } from "@/lib/spaces";
import { Globe, Users, Building2, Lock } from "lucide-react";

type PostType = "article" | "reel" | "image" | "ai_insight" | "discussion";

const TYPES = [
  { id: "article", label: "Article", desc: "Share your thoughts and insights", icon: FileText, color: "text-primary" },
  { id: "reel", label: "Reel", desc: "Create engaging video content", icon: Sparkles, color: "text-accent" },
  { id: "image", label: "Image", desc: "Share photos and visuals", icon: ImageIcon, color: "text-primary" },
  { id: "ai_insight", label: "AI Insight", desc: "Share AI consciousness discoveries", icon: Brain, color: "text-accent" },
  { id: "discussion", label: "Discussion", desc: "Start a community conversation", icon: MessageCircle, color: "text-primary" },
] as const;

function parseTags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function CreateSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<PostType | null>(null);

  // Shared fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [hashtags, setHashtags] = useState("");

  // Media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI Insight extras
  const [aiModel, setAiModel] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const [busy, setBusy] = useState(false);

  // Target picker
  const [targets, setTargets] = useState<PostableSpace[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    listMyPostableSpaces(user.id).then(setTargets).catch(() => setTargets([]));
  }, [open, user]);

  const reset = () => {
    setType(null);
    setTitle("");
    setBody("");
    setCategory("");
    setHashtags("");
    setMediaUrl(null);
    setMediaPreview(null);
    setAiModel("");
    setAiPrompt("");
    setTargetId(null);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, accept: "image" | "video") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (accept === "image" && !file.type.startsWith("image")) {
      toast.error("Please choose an image file");
      return;
    }
    if (accept === "video" && !file.type.startsWith("video")) {
      toast.error("Please choose a video file");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToMedia(file, user.id, type ?? "posts");
      setMediaUrl(url);
      setMediaPreview(url);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to post");
      close(false);
      navigate({ to: "/login" });
      return;
    }
    if (!type) return;

    // Per-type validation
    if (type === "reel" && !mediaUrl) return toast.error("Upload a video for your reel");
    if (type === "image" && !mediaUrl) return toast.error("Upload an image");
    if (type === "article" && (!title.trim() || !body.trim())) return toast.error("Article needs a title and body");
    if (type === "ai_insight" && !body.trim()) return toast.error("Share your insight");
    if (type === "discussion" && !body.trim()) return toast.error("Ask your question");

    setBusy(true);
    try {
      const tags = parseTags(hashtags);

      let finalBody = body.trim();
      if (type === "article" && title.trim()) {
        finalBody = `# ${title.trim()}\n\n${finalBody}`;
      }
      if (type === "ai_insight" && (aiModel.trim() || aiPrompt.trim())) {
        const meta: string[] = [];
        if (aiModel.trim()) meta.push(`Model: ${aiModel.trim()}`);
        if (aiPrompt.trim()) meta.push(`Prompt: ${aiPrompt.trim()}`);
        finalBody = `${finalBody}\n\n— ${meta.join(" · ")}`;
      }

      await createPost({
        author_id: user.id,
        body: finalBody || (type === "image" ? "" : title.trim()),
        type,
        category: category.trim() || null,
        hashtags: tags,
        media_url: mediaUrl,
        space_id: targetId,
      });
      const target = targets.find((t) => t.id === targetId);
      toast.success(target ? `Posted to ${target.name}` : "Posted to Kons");
      reset();
      onOpenChange(false);
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  const currentType = TYPES.find((t) => t.id === type);

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto border-primary/30 bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-primary">
            {type && (
              <button onClick={() => setType(null)} className="rounded p-1 hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {currentType ? `New ${currentType.label}` : "Create Content"}
          </SheetTitle>
        </SheetHeader>

        {!type ? (
          <div className="mt-4 space-y-2 pb-6">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition hover:border-primary/40"
                >
                  <Icon className={`h-6 w-6 ${t.color}`} />
                  <div>
                    <div className="font-semibold text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-3 pb-6">
            {/* TARGET PICKER */}
            <TargetPicker
              targets={targets}
              targetId={targetId}
              onSelect={setTargetId}
              postType={type}
            />
            {/* ARTICLE */}
            {type === "article" && (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title"
                  className="bg-input/40 text-base font-semibold"
                  maxLength={140}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your article. Use blank lines to separate paragraphs..."
                  rows={10}
                  className="bg-input/40"
                  maxLength={20000}
                />
                <MediaPicker
                  accept="image"
                  label="Add cover image"
                  preview={mediaPreview}
                  previewType="image"
                  uploading={uploading}
                  onFile={(e) => handleFile(e, "image")}
                  onClear={() => { setMediaUrl(null); setMediaPreview(null); }}
                />
              </>
            )}

            {/* REEL */}
            {type === "reel" && (
              <>
                <MediaPicker
                  accept="video"
                  label="Upload reel video"
                  preview={mediaPreview}
                  previewType="video"
                  required
                  uploading={uploading}
                  onFile={(e) => handleFile(e, "video")}
                  onClear={() => { setMediaUrl(null); setMediaPreview(null); }}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                  className="bg-input/40"
                  maxLength={2200}
                />
              </>
            )}

            {/* IMAGE */}
            {type === "image" && (
              <>
                <MediaPicker
                  accept="image"
                  label="Upload image"
                  preview={mediaPreview}
                  previewType="image"
                  required
                  uploading={uploading}
                  onFile={(e) => handleFile(e, "image")}
                  onClear={() => { setMediaUrl(null); setMediaPreview(null); }}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                  className="bg-input/40"
                  maxLength={2200}
                />
              </>
            )}

            {/* AI INSIGHT */}
            {type === "ai_insight" && (
              <>
                <Input
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="AI model (e.g. Gemini 3 Pro)"
                  className="bg-input/40"
                  maxLength={80}
                />
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Prompt that sparked the insight (optional)"
                  className="bg-input/40"
                  maxLength={200}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe the insight, behavior, or discovery..."
                  rows={8}
                  className="bg-input/40"
                  maxLength={8000}
                />
              </>
            )}

            {/* DISCUSSION */}
            {type === "discussion" && (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Headline question (optional)"
                  className="bg-input/40 font-semibold"
                  maxLength={140}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Start a thoughtful conversation with the community..."
                  rows={6}
                  className="bg-input/40"
                  maxLength={8000}
                />
              </>
            )}

            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. Development)"
              className="bg-input/40"
              maxLength={40}
            />
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#ConsciousnessAI #PhantomLayer"
              className="bg-input/40"
              maxLength={200}
            />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Posts earn tokens based on community engagement
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setType(null)} className="flex-1">Back</Button>
              <Button
                onClick={submit}
                disabled={busy || uploading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Share ${currentType?.label}`}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MediaPicker({
  accept,
  label,
  preview,
  previewType,
  uploading,
  required,
  onFile,
  onClear,
}: {
  accept: "image" | "video";
  label: string;
  preview: string | null;
  previewType: "image" | "video";
  uploading: boolean;
  required?: boolean;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/60">
        {previewType === "video" ? (
          <video src={preview} controls className="max-h-72 w-full bg-black" />
        ) : (
          <img src={preview} alt="" className="max-h-72 w-full object-cover" />
        )}
        <button onClick={onClear} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-input/30 p-6 text-center text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground",
        required ? "border-primary/40" : "border-border/60",
      )}
    >
      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
      <span>{uploading ? "Uploading..." : label}{required && !uploading ? " (required)" : ""}</span>
      <input
        type="file"
        accept={accept === "video" ? "video/*" : "image/*"}
        hidden
        onChange={onFile}
        disabled={uploading}
      />
    </label>
  );
}

function TargetPicker({
  targets, targetId, onSelect, postType,
}: {
  targets: PostableSpace[];
  targetId: string | null;
  onSelect: (id: string | null) => void;
  postType: PostType;
}) {
  // Reels live globally on /viral — disable target for reel posting? Allow but warn.
  const filtered = targets.filter((t) => t.can_post);
  const iconFor = (k: string) => k === "page" ? Building2 : k === "circle" ? Lock : Users;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-2">
      <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Post to</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onSelect(null)}
          className={cn("flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
            targetId === null ? "border-primary bg-primary/10 text-primary" : "border-border/60")}
        >
          <Globe className="h-3.5 w-3.5" /> Your feed
        </button>
        {filtered.map((t) => {
          const Icon = iconFor(t.kind);
          const selected = targetId === t.id;
          return (
            <button key={t.id} onClick={() => onSelect(t.id)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
                selected ? "border-primary bg-primary/10 text-primary" : "border-border/60")}
            >
              <Icon className="h-3.5 w-3.5" /> {t.name}
              <span className="text-[9px] uppercase text-muted-foreground">{t.kind}</span>
            </button>
          );
        })}
      </div>
      {targetId && targets.find((t) => t.id === targetId)?.kind === "page" && (
        <div className="px-1 pt-1 text-[10px] text-muted-foreground">Posting as the page — visible to all followers.</div>
      )}
      {/* avoid unused-var warning */}
      <input type="hidden" value={postType} readOnly />
    </div>
  );
}