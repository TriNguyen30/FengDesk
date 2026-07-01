/**
 * Generates an SEO-friendly slug from a given string.
 * It removes Vietnamese accents, converts to lowercase, and replaces non-alphanumeric characters with hyphens.
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  // Convert to lower case
  let slug = text.toLowerCase();

  // Replace spaces and special characters with hyphens, keeping letters (including Vietnamese) and numbers
  slug = slug.replace(/[^\p{L}\p{N}]+/gu, "-");

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}
