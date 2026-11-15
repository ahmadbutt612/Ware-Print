"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NoPhoto } from "@/components/listings/no-photo";
import { IconExternal, IconLeft, IconPlay, IconRight, IconVideo, IconX } from "@/components/ui/icons";
import type { GalleryItem } from "@/lib/media";
import { cn } from "@/lib/utils";

const navButton =
  "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center border border-line bg-paper/95 text-ink hover:border-ink";

export function Gallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = items.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) {
    return (
      <div className="aspect-[4/3] border border-line">
        <NoPhoto label="No photos yet" />
      </div>
    );
  }

  const current = items[Math.min(index, count - 1)];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-paper-2">
        <Stage item={current} title={title} onZoom={() => dialogRef.current?.showModal()} />
        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={cn(navButton, "left-2")}>
              <IconLeft />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={cn(navButton, "right-2")}>
              <IconRight />
            </button>
            <span className="pointer-events-none absolute right-2 bottom-2 bg-ink/85 px-2 py-0.5 font-mono text-xs text-white">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {current.caption && <p className="mt-2 text-sm text-ink-2">{current.caption}</p>}

      {count > 1 && (
        <ul className="scrollbar-none mt-2 flex gap-2 overflow-x-auto" aria-label="Photos and videos">
          {items.map((item, i) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${item.kind === "image" ? "photo" : "video"} ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block h-[60px] w-20 overflow-hidden border bg-paper-2",
                  i === index ? "border-red outline outline-1 -outline-offset-2 outline-red" : "border-line hover:border-ink",
                )}
              >
                {item.thumb ? (
                  <img
                    src={item.thumb}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                    // A deleted or private YouTube video has no thumbnail: fall back to the play icon only.
                    onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  />
                ) : (
                  <span className="grid size-full place-items-center text-ink-3">
                    <IconVideo size={20} />
                  </span>
                )}
                {item.kind !== "image" && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-6 place-items-center bg-ink/85 text-white">
                      <IconPlay size={11} />
                    </span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${title} — photos`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-black/70"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-mono">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className="btn btn-sm border-white/40 bg-transparent text-white hover:border-white"
              onClick={() => dialogRef.current?.close()}
            >
              <IconX /> Close
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) dialogRef.current?.close();
            }}
          >
            {current.kind === "image" && current.src ? (
              <img src={current.src} alt={current.caption ?? title} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="aspect-video w-full max-w-4xl">
                <Stage item={current} title={title} />
              </div>
            )}
            {count > 1 && (
              <>
                <button type="button" aria-label="Previous" onClick={() => go(-1)} className={cn(navButton, "left-3")}>
                  <IconLeft />
                </button>
                <button type="button" aria-label="Next" onClick={() => go(1)} className={cn(navButton, "right-3")}>
                  <IconRight />
                </button>
              </>
            )}
          </div>
          {current.caption && <p className="px-4 pb-4 text-center text-sm text-white/80">{current.caption}</p>}
        </div>
      </dialog>
    </div>
  );
}

function Stage({ item, title, onZoom }: { item: GalleryItem; title: string; onZoom?: () => void }) {
  if (item.kind === "image" && item.src) {
    return (
      <button type="button" onClick={onZoom} className="block size-full cursor-zoom-in" aria-label="Open large photo">
        <img src={item.src} alt={item.caption ?? title} className="size-full object-contain" />
      </button>
    );
  }
  if (item.kind === "video" && item.src) {
    return (
      <video key={item.id} src={item.src} controls preload="metadata" playsInline className="size-full bg-black object-contain">
        Your browser cannot play this video.
      </video>
    );
  }
  if (item.kind === "video_link" && item.embedUrl) {
    return (
      <iframe
        key={item.id}
        src={item.embedUrl}
        title={`${title} — video`}
        className="size-full bg-black"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
      <IconVideo size={28} className="text-ink-3" />
      <p className="text-sm text-ink-2">This video is hosted on another website.</p>
      {item.linkUrl && (
        <a href={item.linkUrl} target="_blank" rel="noreferrer nofollow" className="btn btn-outline btn-sm">
          Watch video <IconExternal />
        </a>
      )}
    </div>
  );
}
