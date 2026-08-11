import { createClient } from "@/lib/supabase/client";

interface UploadImageOptions {
  file: File;
  bucket: "avatar" | "banner";
  path: string;
  maxWidth?: number;
  quality?: number;
}

interface UploadImageResult {
  path: string;
  publicUrl: string;
  storagePath: string;
}

const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
const MAX_SOURCE_DIMENSION = 8192;
const MAX_SOURCE_PIXELS = 40_000_000;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
]);

/**
 * Validates, decodes and converts a user image to a real WebP before uploading it.
 * This utility is intentionally limited to image processing and Storage I/O.
 * Database metadata updates are performed through a protected RPC.
 */
export async function processAndUploadImage({
  file,
  bucket,
  path,
  maxWidth = 1200,
  quality = 0.8,
}: UploadImageOptions): Promise<{
  data: UploadImageResult | null;
  error: Error | null;
}> {
  try {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return {
        data: null,
        error: new Error(
          "Formato de imagem não suportado. Usa JPG, JPEG, PNG, WebP, GIF, BMP, TIFF ou AVIF.",
        ),
      };
    }

    if (file.size <= 0) {
      return { data: null, error: new Error("O ficheiro de imagem está vazio.") };
    }

    if (file.size > MAX_SOURCE_SIZE) {
      return {
        data: null,
        error: new Error("A imagem é demasiado grande. O limite é 10 MB."),
      };
    }

    const webpBlob = await convertToWebp(file, maxWidth, quality);
    if (webpBlob.type !== "image/webp") {
      return {
        data: null,
        error: new Error("Não foi possível validar a conversão para WebP."),
      };
    }

    const supabase = createClient();
    const webpPath = path.replace(/\.[^/.]+$/, "") + ".webp";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(webpPath, webpBlob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Upload Error - ${bucket}]:`, uploadError);
      return { data: null, error: new Error("Não foi possível carregar a imagem para o armazenamento.") };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(webpPath);
    const publicUrl = publicUrlData.publicUrl;

    if (!publicUrl) {
      console.error("[Upload Error]: Supabase did not return a public URL", {
        bucket,
        path: webpPath,
      });
      return { data: null, error: new Error("Não foi possível obter o endereço da imagem.") };
    }

    if (bucket === "avatar") {
      const barbershopId = webpPath.split("/")[0];
      if (!barbershopId) {
        return { data: null, error: new Error("Caminho do avatar inválido.") };
      }

      const { error: metadataError } = await supabase.rpc(
        "set_barbershop_avatar_url",
        {
          p_barbershop_id: barbershopId,
          p_avatar_url: publicUrl,
        },
      );

      if (metadataError) {
        console.error("[Avatar Metadata Error]:", metadataError);
        return {
          data: null,
          error: new Error(
            "Não foi possível associar o avatar à barbearia. Verifica as permissões da tua conta.",
          ),
        };
      }
    }

    return {
      data: {
        ...uploadData,
        path: webpPath,
        publicUrl,
        storagePath: webpPath,
      },
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
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    img.onload = () => {
      try {
        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;

        if (!sourceWidth || !sourceHeight) {
          fail(new Error("Não foi possível determinar as dimensões da imagem."));
          return;
        }

        if (
          sourceWidth > MAX_SOURCE_DIMENSION ||
          sourceHeight > MAX_SOURCE_DIMENSION ||
          sourceWidth * sourceHeight > MAX_SOURCE_PIXELS
        ) {
          fail(new Error("As dimensões da imagem são demasiado grandes."));
          return;
        }

        let width = sourceWidth;
        let height = sourceHeight;

        if (width > maxWidth) {
          height = Math.max(1, Math.round((height * maxWidth) / width));
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail(new Error("Não foi possível inicializar o processamento da imagem."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.type !== "image/webp") {
              fail(new Error("O navegador não conseguiu converter a imagem para WebP."));
              return;
            }

            if (settled) return;
            settled = true;
            URL.revokeObjectURL(objectUrl);
            resolve(blob);
          },
          "image/webp",
          Math.min(1, Math.max(0.1, quality)),
        );
      } catch (error) {
        fail(
          error instanceof Error
            ? error
            : new Error("Falha ao processar a imagem."),
        );
      }
    };

    img.onerror = () => {
      fail(
        new Error(
          "Não foi possível ler esta imagem. Escolhe uma imagem válida num formato suportado.",
        ),
      );
    };

    img.src = objectUrl;
  });
}
