import { useState } from "react";
import Calendar from "@/components/ui/Calendar";

export function Default() {
  const [value, setValue] = useState("2026-07-08");
  return <Calendar value={value} onChange={setValue} />;
}

export function Empty() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return <Calendar value={value} onChange={setValue} />;
}
