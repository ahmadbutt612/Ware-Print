import { SUPABASE_URL } from "@/lib/env";
import type { ListingMedia } from "@/lib/types";

export interface GalleryItem {
  id: string;
  kind: "image" | "video" | "video_link";
  /** Full image, or the video file */
  src: string | null;
  thumb: string | null;
  /** Embeddable player (YouTube / Vimeo) */
  embedUrl: string | null;
  /** Video hosted somewhere we cannot embed */
  linkUrl: string | null;
  caption: string | null;
}

/** Images first (in the seller's order), then videos. */
export function buildGallery(media: ListingMedia[]): GalleryItem[] {
  const sorted = [...media].sort((a, b) => {
    const rank = (m: ListingMedia) => (m.kind === "image" ? 0 : 1);
    return rank(a) - rank(b) || a.position - b.position;
  });
  return sorted.flatMap<GalleryItem>((m) => {
    if (m.kind === "image") {
      return [
        {
          id: m.id,
          kind: "image",
          src: mediaUrl(m.storage_path),
          thumb: mediaUrl(m.thumb_path ?? m.storage_path),
          embedUrl: null,
          linkUrl: null,
          caption: m.caption,
        },
      ];
    }
    if (m.kind === "video") {
      return [
        { id: m.id, kind: "video", src: mediaUrl(m.storage_path), thumb: null, embedUrl: null, linkUrl: null, caption: m.caption },
      ];
    }
    const info = m.url ? parseVideoUrl(m.url) : null;
    if (!info) return [];
    return [
      {
        id: m.id,
        kind: "video_link",
        src: null,
        thumb: info.thumbUrl,
        embedUrl: info.embedUrl,
        linkUrl: info.url,
        caption: m.caption,
      },
    ];
  });
}

export const MEDIA_BUCKET = "listing-media";
export const MAX_IMAGES = 30;
export const MAX_VIDEOS = 5;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // Supabase free plan limit per file
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/** Public URL of a file in the listing-media bucket. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}

export interface VideoLinkInfo {
  provider: "youtube" | "vimeo" | "other";
  embedUrl: string | null;
  thumbUrl: string | null;
  url: string;
}

export function parseVideoUrl(raw: string): VideoLinkInfo | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  let youtubeId: string | null = null;
  if (host === "youtu.be") youtubeId = url.pathname.slice(1).split("/")[0] || null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") youtubeId = url.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(url.pathname);
      youtubeId = m?.[1] ?? null;
    }
  }
  if (youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /\/(\d{6,12})(?:$|[/?#])/.exec(url.pathname);
    if (m) {
      return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${m[1]}`, thumbUrl: null, url: url.toString() };
    }
  }

  return { provider: "other", embedUrl: null, thumbUrl: null, url: url.toString() };
}
