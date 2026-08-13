function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}
function isAudio(url: string) {
  return /\.(mp3|wav|m4a|ogg|webm)(\?|$)/i.test(url) && !isVideo(url);
}

export function PostMedia({ url }: { url: string }) {
  if (!url) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
      {isVideo(url) ? (
        <video src={url} controls playsInline className="max-h-[70vh] w-full bg-black" preload="metadata" />
      ) : isAudio(url) ? (
        <audio src={url} controls className="w-full" preload="metadata" />
      ) : (
        <img src={url} alt="" loading="lazy" className="max-h-[70vh] w-full object-cover" />
      )}
    </div>
  );
}