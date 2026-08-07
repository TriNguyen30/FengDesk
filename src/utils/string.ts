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

/**
 * Cleans HTML content generated from rich text editors or copied from websites.
 * Removes hardcoded white/near-white backgrounds and dark text colors that break in dark mode,
 * while preserving valid semantic tags, alignments, links, images, and explicit highlight colors.
 */
export function cleanRichTextHtml(html: string): string {
  if (!html) return "";

  let cleaned = html.replace(/&nbsp;/g, " ");

  // 1. Remove all inline background-color / background styles
  cleaned = cleaned.replace(/background(-color)?\s*:\s*[^;"]+\s*;?/gi, "");

  // 2. Remove hardcoded dark / gray text colors from inline styles so dark mode can render white/light text
  cleaned = cleaned.replace(
    /color\s*:\s*([^;"]+)\s*;?/gi,
    (match, colorVal) => {
      const val = colorVal.trim().toLowerCase();
      // Keep only bright deliberate highlight colors (e.g. red, yellow, green, orange, blue, purple)
      const isBrightAccent =
        val.includes("230, 0, 0") ||
        val.includes("255, 153, 0") ||
        val.includes("0, 138, 0") ||
        val.includes("0, 102, 204") ||
        val.includes("153, 51, 255") ||
        val === "red" ||
        val === "yellow" ||
        val === "blue" ||
        val === "orange" ||
        val === "green" ||
        val === "purple";

      if (!isBrightAccent) {
        return "";
      }
      return match;
    }
  );

  // 3. Remove font-family overrides that might interfere with app typography
  cleaned = cleaned.replace(/font-family\s*:\s*[^;"]+\s*;?/gi, "");

  // 4. Clean <font color="..."> attributes
  cleaned = cleaned.replace(/<font\s+([^>]*?)color=["'][^"']*["']([^>]*?)>/gi, "<font $1 $2>");

  // 5. Clean empty style attributes left behind
  cleaned = cleaned.replace(/style="\s*"/gi, "");
  cleaned = cleaned.replace(/style='\s*'/gi, "");

  return cleaned;
}

