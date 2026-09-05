/**
 * Long edge, in pixels, above which an upload is downscaled. The menu card
 * shows an image in a ~330px box and the gallery viewer near full-screen, so
 * this is the smallest cap that still looks right on a card at 2x.
 */
export const IMAGE_MAX_EDGE = 1200;
export const IMAGE_QUALITY = 0.75;

/**
 * Re-encoding these would destroy them: a canvas keeps only the first frame of
 * an animation, and rasterises a vector at whatever size it was drawn.
 */
const PASS_THROUGH = ['image/gif', 'image/svg+xml'];

/**
 * Shrinks a picked file before it is uploaded: capped to IMAGE_MAX_EDGE on its
 * long edge and re-encoded as WebP. A phone photo arrives at 3-5 MB and 4000px
 * wide, which is several megabytes of pixels no visitor ever sees.
 *
 * Resolves to the original file whenever re-encoding is unsafe or pointless,
 * so a caller can always just upload what it gets back.
 */
export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || PASS_THROUGH.includes(file.type)) return file;

  try {
    const source = await decode(file);
    try {
      const { width, height } = scaled(source.width, source.height);
      const blob = await encode(source, width, height);

      // An already-optimised small image can come back bigger than it went in;
      // keep whichever is actually smaller, unless we also gained a downscale.
      const shrank = width < source.width;
      if (!blob || (!shrank && blob.size >= file.size)) return file;

      return new File([blob], webpName(file.name), {
        type: 'image/webp',
        lastModified: file.lastModified,
      });
    } finally {
      if ('close' in source) source.close();
    }
  } catch (err) {
    // A decode failure must not cost the admin their upload — send the
    // original and let storage deal with it.
    console.error('Image optimisation failed, uploading the original:', err);
    return file;
  }
}

/**
 * `imageOrientation` is what keeps a portrait phone photo upright: the EXIF
 * rotation is metadata the canvas would otherwise ignore. The option is not
 * universal, hence the <img> fallback, which browsers orient themselves.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return decodeViaElement(file);
  }
}

function decodeViaElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('could not decode ' + file.type));
    image.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/** Fits the long edge to IMAGE_MAX_EDGE. Never upscales. */
function scaled(width: number, height: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= IMAGE_MAX_EDGE) return { width, height };

  const ratio = IMAGE_MAX_EDGE / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function encode(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', IMAGE_QUALITY));
}

function webpName(name: string): string {
  return name.replace(/\.[^.]+$/, '') + '.webp';
}
