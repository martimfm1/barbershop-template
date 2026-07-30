import { createClient } from "@/lib/supabase/client";

interface UploadImageOptions {
  file: File;
  bucket: "avatar" | "banner";
  path: string;
  maxWidth?: number;
  quality?: number;
}


export async function processAndUploadImage({
  file,
  bucket,
  path,
  maxWidth = 1200,
  quality = 0.8,
}: UploadImageOptions): Promise<{ data: any; error: any }> {
  try {
    const webpBlob = await convertToWebp(file, maxWidth, quality);

    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, webpBlob, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error) {
      console.error(`[Upload Error - ${bucket}]:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("[Process Image Error]:", err);
    return { data: null, error: err };
  }
}

function convertToWebp(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível inicializar o contexto 2D do Canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Falha ao converter imagem para WebP."));
            }
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Erro ao carregar a imagem de origem."));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Erro ao ler o ficheiro selecionado."));
    reader.readAsDataURL(file);
  });
}