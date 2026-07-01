export function splitOpeningHours(raw: string | null | undefined): { open: string; close: string } {
  if (!raw) return { open: "", close: "" };
  const parts = raw.split(/\s*[-–—]\s*/);
  const toHHMM = (value: string) => {
    const trimmed = value.trim();
    const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
      let hour = parseInt(ampm[1], 10);
      const minute = ampm[2];
      const isPM = ampm[3].toUpperCase() === "PM";
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return `${String(hour).padStart(2, "0")}:${minute}`;
    }
    const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
    return "";
  };

  return { open: toHHMM(parts[0] ?? ""), close: toHHMM(parts[1] ?? "") };
}

export function joinOpeningHours(open: string, close: string): string {
  if (!open && !close) return "";
  if (open && !close) return open;
  if (!open && close) return close;
  return `${open} - ${close}`;
}

export function normalizeOpeningHours(raw: string): string {
  return raw
    .trim()
    .replace(/\s*[–—]\s*/g, " - ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ");
}