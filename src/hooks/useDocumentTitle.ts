import { useEffect } from "react";

const DEFAULT_SUFFIX = "Feng Shui Garden";

/**
 * Custom hook to set document.title dynamically.
 * @param title Title string to set
 * @param raw If true, sets exact string without appending standard suffix
 */
export function useDocumentTitle(title?: string, raw: boolean = false) {
  useEffect(() => {
    if (!title) return;
    const fullTitle = raw ? title : `${title} - ${DEFAULT_SUFFIX}`;
    document.title = fullTitle;
  }, [title, raw]);
}
