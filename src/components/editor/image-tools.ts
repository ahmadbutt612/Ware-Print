// Resize photos in the browser before upload: a large JPEG for the gallery and
// a small one for cards. Keeps storage small and pages fast on mobile data.

type Source = ImageBitmap | HTMLImageElement;

async function load(file: File): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img> decoding
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This photo could not be read. Please use a JPG or PNG file."));
    };
    img.src = url;
  });
}

function toJpeg(src: Source, maxSide: number, quality: number): Promise<Blob> {
  const width = "naturalWidth" in src ? src.naturalWidth : src.width;
  const height = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Your browser could not process this photo."));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Your browser could not process this photo."))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function prepareImage(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const src = await load(file);
  try {
    const full = await toJpeg(src, 2000, 0.85);
    const thumb = await toJpeg(src, 640, 0.8);
    return { full, thumb };
  } finally {
    if ("close" in src) src.close();
  }
}

/** Run async jobs with a small concurrency limit. */
export async function runPool<T>(items: T[], limit: number, job: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift()!;
      await job(next);
    }
  });
  await Promise.all(workers);
}
