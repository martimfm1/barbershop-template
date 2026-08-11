import { createClient } from "@/lib/supabase/client";

interface UploadImageOptions {
  file: File;
  bucket: "avatar" | "banner";
  path: string;
  maxWidth?: number;
  quality?: number;
}

const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/svg+xml",
]);

export async function processAndUploadImage({
  file,
  bucket,
  path,
  maxWidth = 1200,
  quality = 0.8,
}: UploadImageOptions): Promise<{ data: any; error: any }> {
  try {
    if (!file.type.startsWith("image/") || !SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return {
        data: null,
        error: new Error(
          "Formato de imagem não suportado. Usa JPG, PNG, WebP, GIF, BMP, TIFF, AVIF ou SVG.",
        ),
      };
    }

    if (file.size > MAX_SOURCE_SIZE) {
      return {
        data: null,
        error: new Error("A imagem é demasiado grande. O limite é 10 MB."),
      };
    }

    const webpBlob = await convertToWebp(file, maxWidth, quality);
    const supabase = createClient();

    // O caminho é sempre normalizado para .webp, independentemente da extensão original.
    const webpPath = path.replace(/\.[^/.]+$/, "") + ".webp";

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(webpPath, webpBlob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (error) {
      console.error(`[Upload Error - ${bucket}]:`, error);
      return { data: null, error };
    }

    if (bucket === "avatar") {
      const barbershopId = webpPath.split("/")[0];
      if (barbershopId) {
        const { data: publicUrl } = supabase.storage
          .from(bucket)
          .getPublicUrl(webpPath);

        const { error: metadataError } = await supabase
          .from("barbershops")
          .update({ avatar_url: publicUrl.publicUrl })
          .eq("id", barbershopId);

        if (metadataError) {
          console.error("[Avatar Metadata Error]:", metadataError);
          return { data: null, error: metadataError };
        }
      }
    }

    return {
      data: { ...data, path: webpPath },
      error: null,
    };
  } catch (err) {
    console.error("[Process Image Error]:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error("Não foi possível processar a imagem."),
    };
  }
}

function convertToWebp(
  file: File,
  maxWidth: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (!width || !height) {
          reject(new Error("Não foi possível determinar as dimensões da imagem."));
          return;
        }

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível inicializar o processamento da imagem."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao converter a imagem para WebP."));
              return;
            }

            resolve(blob);
          },
          "image/webp",
          Math.min(1, Math.max(0.1, quality)),
        );
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Falha ao processar a imagem."),
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Não foi possível ler esta imagem. Escolhe uma imagem válida num formato suportado.",
        ),
      );
    };

    img.src = objectUrl;
  });
}
