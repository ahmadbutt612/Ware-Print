"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { prepareImage, runPool } from "@/components/editor/image-tools";
import { IconImage, IconLeft, IconLink, IconRight, IconVideo, IconX } from "@/components/ui/icons";
import type { MediaDraft } from "@/lib/listing-input";
import {
  IMAGE_TYPES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  MAX_VIDEOS,
  MEDIA_BUCKET,
  mediaUrl,
  parseVideoUrl,
  VIDEO_TYPES,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Upload {
  key: string;
  name: string;
  kind: "image" | "video";
  preview: string | null;
  error?: string;
}

type MediaUpdater = (fn: (prev: MediaDraft[]) => MediaDraft[]) => void;

export function MediaManager({
  userId,
  listingId,
  media,
  onChange,
  savedPaths,
  onBusyChange,
  error,
}: {
  userId: string;
  listingId: string;
  media: MediaDraft[];
  onChange: MediaUpdater;
  savedPaths: Set<string>;
  onBusyChange: (busy: boolean) => void;
  error?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind !== "image");
  const pendingImages = uploads.filter((u) => u.kind === "image" && !u.error).length;
  const pendingVideos = uploads.filter((u) => u.kind === "video" && !u.error).length;

  // Tell the editor while uploads are running, so it can block saving until they finish.
  const busy = uploads.some((u) => !u.error);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const setUploadsAndBusy = setUploads;

  function failUpload(key: string, message: string) {
    setUploadsAndBusy((prev) => prev.map((u) => (u.key === key ? { ...u, error: message } : u)));
  }

  function finishUpload(key: string, item: MediaDraft) {
    setUploadsAndBusy((prev) => prev.filter((u) => u.key !== key));
    onChange((prev) => [...prev, item]);
  }

  function friendlyError(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    if (/row-level security|unauthorized|403/i.test(msg)) return "Upload not allowed. Verify your phone number first, then try again.";
    if (/exceeded|too large|413/i.test(msg)) return "This file is too large.";
    if (/mime|type/i.test(msg)) return "This file type is not allowed.";
    return msg || "Upload failed. Check your connection and try again.";
  }

  async function addPhotos(files: File[]) {
    const room = MAX_IMAGES - images.length - pendingImages;
    const accepted = files.slice(0, Math.max(0, room));
    const jobs = accepted.map((file) => ({ file, key: crypto.randomUUID() }));
    setUploadsAndBusy((prev) => [
      ...prev,
      ...jobs.map(({ file, key }) => ({
        key,
        name: file.name,
        kind: "image" as const,
        preview: URL.createObjectURL(file),
        error:
          IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)
            ? undefined
            : "Use JPG, PNG or WEBP photos. On iPhone, choose “Most compatible” in camera settings.",
      })),
      ...files.slice(accepted.length).map((file) => ({
        key: crypto.randomUUID(),
        name: file.name,
        kind: "image" as const,
        preview: null,
        error: `Limit reached: at most ${MAX_IMAGES} photos per listing.`,
      })),
    ]);

    const valid = jobs.filter(({ file }) => IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name));
    await runPool(valid, 3, async ({ file, key }) => {
      try {
        const { full, thumb } = await prepareImage(file);
        const base = `${userId}/${listingId}/${key}`;
        const opts = { contentType: "image/jpeg", cacheControl: "31536000", upsert: false };
        const a = await supabase.storage.from(MEDIA_BUCKET).upload(`${base}.jpg`, full, opts);
        if (a.error) throw a.error;
        const b = await supabase.storage.from(MEDIA_BUCKET).upload(`${base}_thumb.jpg`, thumb, opts);
        if (b.error) throw b.error;
        finishUpload(key, {
          id: key,
          kind: "image",
          storagePath: `${base}.jpg`,
          thumbPath: `${base}_thumb.jpg`,
          url: null,
          caption: "",
        });
      } catch (e) {
        failUpload(key, friendlyError(e));
      }
    });
  }

  async function addVideo(file: File) {
    const key = crypto.randomUUID();
    const typeOk = VIDEO_TYPES.includes(file.type);
    const sizeOk = file.size <= MAX_VIDEO_BYTES;
    const roomOk = videos.length + pendingVideos < MAX_VIDEOS;
    const problem = !typeOk
      ? "Use an MP4, MOV or WEBM video."
      : !sizeOk
        ? "Videos must be 50 MB or smaller. Upload a shorter clip, or add a YouTube link instead."
        : !roomOk
          ? `At most ${MAX_VIDEOS} videos per listing.`
          : undefined;
    setUploadsAndBusy((prev) => [...prev, { key, name: file.name, kind: "video", preview: null, error: problem }]);
    if (problem) return;

    const ext = file.type === "video/quicktime" ? "mov" : file.type === "video/webm" ? "webm" : "mp4";
    const path = `${userId}/${listingId}/${key}.${ext}`;
    try {
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      finishUpload(key, { id: key, kind: "video", storagePath: path, thumbPath: null, url: null, caption: "" });
    } catch (e) {
      failUpload(key, friendlyError(e));
    }
  }

  function addLink() {
    const info = parseVideoUrl(linkInput);
    if (!info) {
      setLinkError("Paste a full link, e.g. https://youtu.be/…");
      return;
    }
    if (videos.length >= MAX_VIDEOS) {
      setLinkError(`At most ${MAX_VIDEOS} videos per listing.`);
      return;
    }
    onChange((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "video_link", storagePath: null, thumbPath: null, url: info.url, caption: "" },
    ]);
    setLinkInput("");
    setLinkError("");
  }

  function remove(item: MediaDraft) {
    onChange((prev) => prev.filter((m) => m.id !== item.id));
    // Files uploaded in this session and never saved can be deleted right away.
    const paths = [item.storagePath, item.thumbPath].filter((p): p is string => Boolean(p) && !savedPaths.has(p!));
    if (paths.length) void supabase.storage.from(MEDIA_BUCKET).remove(paths);
  }

  function moveImage(id: string, delta: number) {
    onChange((prev) => {
      const imgs = prev.filter((m) => m.kind === "image");
      const rest = prev.filter((m) => m.kind !== "image");
      const i = imgs.findIndex((m) => m.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= imgs.length) return prev;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return [...imgs, ...rest];
    });
  }

  function makeCover(id: string) {
    onChange((prev) => {
      const imgs = prev.filter((m) => m.kind === "image");
      const rest = prev.filter((m) => m.kind !== "image");
      const item = imgs.find((m) => m.id === id);
      if (!item) return prev;
      return [item, ...imgs.filter((m) => m.id !== id), ...rest];
    });
  }

  function setCaption(id: string, caption: string) {
    onChange((prev) => prev.map((m) => (m.id === id ? { ...m, caption } : m)));
  }

  const imageUploads = uploads.filter((u) => u.kind === "image");
  const videoUploads = uploads.filter((u) => u.kind === "video");

  return (
    <div className="space-y-8">
      {/* Photos */}
      <div data-field-error={error ? "true" : undefined}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold">Photos</h3>
            <p className="text-sm text-ink-2">
              The first photo is the cover. Show the whole machine, the control panel, feeder and delivery, and the
              nameplate with model and serial number.
            </p>
          </div>
          <p className="tnum text-sm text-ink-3">
            {images.length} / {MAX_IMAGES}
          </p>
        </div>

        <div
          className={cn(
            "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
            error && images.length === 0 && "outline outline-1 outline-offset-4 outline-red",
          )}
        >
          {images.map((m, i) => (
            <figure key={m.id} className="flex flex-col border border-line bg-paper">
              <div className="relative aspect-[4/3] bg-paper-2">
                <img src={mediaUrl(m.thumbPath ?? m.storagePath) ?? ""} alt="" className="size-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-red px-1.5 text-[11px] leading-5 font-semibold text-white">COVER</span>
                )}
              </div>
              <figcaption className="space-y-2 border-t border-line p-2">
                <input
                  value={m.caption}
                  onChange={(e) => setCaption(m.id, e.target.value)}
                  maxLength={140}
                  placeholder="Caption (optional)"
                  aria-label={`Caption for photo ${i + 1}`}
                  className="field-input min-h-8 px-2 py-1 text-[13px]"
                />
                <div className="flex items-center gap-1">
                  <button type="button" className="btn btn-outline btn-sm px-2" onClick={() => moveImage(m.id, -1)} disabled={i === 0} aria-label="Move left">
                    <IconLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm px-2"
                    onClick={() => moveImage(m.id, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move right"
                  >
                    <IconRight size={14} />
                  </button>
                  {i > 0 && (
                    <button type="button" className="btn btn-outline btn-sm px-2 text-xs" onClick={() => makeCover(m.id)}>
                      Cover
                    </button>
                  )}
                  <button type="button" className="btn btn-outline btn-sm ml-auto px-2 text-red" onClick={() => remove(m)} aria-label="Remove photo">
                    <IconX size={14} />
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}

          {imageUploads.map((u) => (
            <div key={u.key} className={cn("flex flex-col border bg-paper", u.error ? "border-red" : "border-line")}>
              <div className="relative aspect-[4/3] bg-paper-2">
                {u.preview && <img src={u.preview} alt="" className={cn("size-full object-cover", !u.error && "opacity-50")} />}
                {!u.error && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="bg-ink px-2 py-1 text-xs font-medium text-white">Uploading…</span>
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2 border-t border-line p-2 text-xs">
                <p className={cn("min-w-0 flex-1", u.error ? "text-red" : "truncate text-ink-3")}>{u.error ?? u.name}</p>
                {u.error && (
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setUploadsAndBusy((prev) => prev.filter((x) => x.key !== u.key))}
                    className="text-ink-3 hover:text-ink"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {images.length + pendingImages < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void addPhotos(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
              }}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-dashed border-line-strong bg-paper-2 p-3 text-center text-sm text-ink-2 hover:border-ink hover:text-ink"
            >
              <IconImage size={22} />
              <span className="font-medium">Add photos</span>
              <span className="text-xs text-ink-3">or drop them here</span>
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-[13px] font-medium text-red">{error}</p>}
        <input
          ref={photoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void addPhotos(files);
          }}
        />
      </div>

      {/* Videos */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold">Videos</h3>
            <p className="text-sm text-ink-2">
              A short clip of the machine running builds trust. Upload a file up to 50 MB, or paste a YouTube link.
            </p>
          </div>
          <p className="tnum text-sm text-ink-3">
            {videos.length} / {MAX_VIDEOS}
          </p>
        </div>

        {(videos.length > 0 || videoUploads.length > 0) && (
          <ul className="mt-3 divide-y divide-line border border-line">
            {videos.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="grid size-9 shrink-0 place-items-center bg-paper-2 text-ink-2">
                  {m.kind === "video" ? <IconVideo /> : <IconLink />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.kind === "video" ? "Uploaded video" : (m.url ?? "Video link")}
                  </p>
                  <input
                    value={m.caption}
                    onChange={(e) => setCaption(m.id, e.target.value)}
                    maxLength={140}
                    placeholder="Caption, e.g. Running at 250 m/min"
                    aria-label="Video caption"
                    className="field-input mt-1.5 min-h-8 px-2 py-1 text-[13px]"
                  />
                </div>
                <button type="button" className="btn btn-outline btn-sm text-red" onClick={() => remove(m)}>
                  Remove
                </button>
              </li>
            ))}
            {videoUploads.map((u) => (
              <li key={u.key} className="flex items-center gap-3 p-3 text-sm">
                <span className="grid size-9 shrink-0 place-items-center bg-paper-2 text-ink-2">
                  <IconVideo />
                </span>
                <p className={cn("min-w-0 flex-1", u.error ? "text-red" : "text-ink-2")}>
                  {u.error ? `${u.name}: ${u.error}` : `Uploading ${u.name}… large videos can take a few minutes.`}
                </p>
                {u.error && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setUploadsAndBusy((prev) => prev.filter((x) => x.key !== u.key))}
                  >
                    Dismiss
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {videos.length + pendingVideos < MAX_VIDEOS && (
          <div className="mt-3 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button type="button" className="btn btn-outline" onClick={() => videoInput.current?.click()}>
              <IconVideo /> Upload video file
            </button>
            <div>
              <div className="flex">
                <input
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    setLinkError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="Paste a YouTube or Vimeo link"
                  aria-label="Video link"
                  className="field-input rounded-r-none border-r-0"
                />
                <button type="button" className="btn btn-dark rounded-l-none" onClick={addLink}>
                  Add link
                </button>
              </div>
              {linkError && <p className="mt-1.5 text-[13px] text-red">{linkError}</p>}
            </div>
          </div>
        )}
        <input
          ref={videoInput}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void addVideo(file);
          }}
        />
      </div>
    </div>
  );
}
