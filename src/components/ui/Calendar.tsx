import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface CalendarProps {
  value?: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function Calendar({ value, onChange, className }: CalendarProps) {
  const [date, setDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(); // Default to today
  });
  
  const [view, setView] = useState<"days" | "months" | "years">("days");
  
  // Update internal date if value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) setDate(d);
    }
  }, [value]);

  const year = date.getFullYear();
  const month = date.getMonth();

  // For Year View
  const yearPageStart = Math.floor(year / 12) * 12;

  const handlePrev = () => {
    if (view === "days") setDate(new Date(year, month - 1, 1));
    else if (view === "years") setDate(new Date(year - 12, month, 1));
  };

  const handleNext = () => {
    if (view === "days") setDate(new Date(year, month + 1, 1));
    else if (view === "years") setDate(new Date(year + 12, month, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day);
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const renderDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    let selectedDay = -1;
    if (value) {
      const valDate = new Date(value);
      if (!isNaN(valDate.getTime()) && valDate.getFullYear() === year && valDate.getMonth() === month) {
        selectedDay = valDate.getDate();
      }
    }

    return (
      <div className="grid grid-cols-7 gap-1 mt-2 text-center text-sm">
        {DAYS.map(d => <div key={d} className="font-medium text-gray-500 py-1">{d}</div>)}
        {blanks.map(b => <div key={`blank-${b}`} className="py-1" />)}
        {days.map(d => {
          const isSelected = d === selectedDay;
          return (
            <button
              key={d}
              type="button"
              onClick={() => handleSelectDay(d)}
              className={twMerge(
                "h-8 w-8 rounded-full flex items-center justify-center mx-auto hover:bg-gray-100 transition-colors cursor-pointer",
                isSelected && "bg-primary text-white hover:bg-primary-dark font-medium"
              )}
            >
              {d}
            </button>
          )
        })}
      </div>
    );
  };

  const renderMonths = () => (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {MONTHS.map((m, i) => (
        <button
          key={m}
          type="button"
          onClick={() => {
            setDate(new Date(year, i, 1));
            setView("days");
          }}
          className={twMerge(
            "py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer",
            month === i && "bg-primary/10 text-primary font-medium"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );

  const renderYears = () => {
    const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
    return (
      <div className="grid grid-cols-3 gap-2 mt-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => {
              setDate(new Date(y, month, 1));
              setView("months");
            }}
            className={twMerge(
              "py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer",
              year === y && "bg-primary/10 text-primary font-medium"
            )}
          >
            {y}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={twMerge("w-[280px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer">
          <ChevronLeft size={18} />
        </button>
        
        <button
          type="button"
          onClick={() => {
            if (view === "days") setView("months");
            else if (view === "months") setView("years");
          }}
          className="font-semibold text-gray-900 text-sm px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          {view === "days" && `${MONTHS[month]} năm ${year}`}
          {view === "months" && `Năm ${year}`}
          {view === "years" && `${yearPageStart} - ${yearPageStart + 11}`}
        </button>

        <button type="button" onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer">
          <ChevronRight size={18} />
        </button>
      </div>

      {view === "days" && renderDays()}
      {view === "months" && renderMonths()}
      {view === "years" && renderYears()}
    </div>
  );
}
