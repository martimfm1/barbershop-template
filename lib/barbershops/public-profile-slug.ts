export const PUBLIC_PROFILE_RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "barbershops",
  "checkout",
  "dashboard",
  "login",
  "logout",
  "plans",
  "privacy",
  "terms",
  "loyalty",
  "book",
  "reviews",
  "cidade",
  "servicos",
  "barbeiros",
  "my-bookings",
  "favicon",
  "robots.txt",
  "sitemap.xml",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicProfileSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

export function validatePublicProfileSlug(value: string): string | null {
  const slug = normalizePublicProfileSlug(value);
  if (slug.length < 3 || slug.length > 60) return "O link deve ter entre 3 e 60 caracteres.";
  if (!SLUG_PATTERN.test(slug)) return "O link contém caracteres inválidos.";
  if (PUBLIC_PROFILE_RESERVED_SLUGS.has(slug)) return "Este link está reservado pela plataforma.";
  return null;
}
