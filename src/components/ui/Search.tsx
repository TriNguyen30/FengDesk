// components/SearchBar.tsx
import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { useSearch } from "@/features/search";
import { filterPlantKeywordSuggestions } from "@/data/plantSearchKeywords";

interface SearchBarProps {
  placeholder?: string | string[];
  onSearch?: (query: string) => void;
}

const DEFAULT_PLACEHOLDERS = [
  "Bạn cần tìm cây gì?",
  "Tìm cây phong thủy theo mệnh...",
  "Cây cảnh để bàn làm việc...",
  "Tìm kiếm vật phẩm may mắn...",
  "Cây quà tặng ý nghĩa...",
];

export default function SearchBar({
  placeholder = DEFAULT_PLACEHOLDERS,
  onSearch,
}: SearchBarProps) {
  const { keyword, setKeyword } = useSearch();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const suggestions = useMemo(() => filterPlantKeywordSuggestions(keyword, 8), [keyword]);

  const showPanel = open && suggestions.length > 0;

  const [typedPlaceholder, setTypedPlaceholder] = useState(
    typeof placeholder === "string" ? placeholder : "",
  );

  useEffect(() => {
    if (typeof placeholder === "string") {
      setTypedPlaceholder(placeholder);
      return;
    }

    if (!placeholder || placeholder.length === 0) return;

    let currentText = "";
    let currentIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      const fullText = placeholder[currentIndex];

      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
      }

      setTypedPlaceholder(currentText);

      let typeSpeed = isDeleting ? 30 : 60;

      if (!isDeleting && currentText === fullText) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % placeholder.length;
        typeSpeed = 500;
      }

      timeout = setTimeout(type, typeSpeed);
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, [placeholder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight((h) => {
      if (suggestions.length === 0) return -1;
      if (h < 0) return -1;
      return Math.min(h, suggestions.length - 1);
    });
  }, [suggestions]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setHighlight(-1);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const handleSearch = useCallback(() => {
    onSearch?.(keyword.trim());
    setOpen(false);
    setHighlight(-1);
  }, [keyword, onSearch]);

  const applySuggestion = useCallback(
    (text: string) => {
      setKeyword(text);
      onSearch?.(text);
      setOpen(false);
      setHighlight(-1);
    },
    [onSearch, setKeyword],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      if (!suggestions.length) return;
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h < 0 ? 0 : Math.min(h + 1, suggestions.length - 1)));
      return;
    }

    if (e.key === "ArrowUp") {
      if (!suggestions.length || !open) return;
      e.preventDefault();
      setHighlight((h) => {
        const next = h <= 0 ? 0 : h - 1;
        return next;
      });
      return;
    }

    if (e.key === "Enter") {
      if (open && highlight >= 0 && suggestions[highlight]) {
        e.preventDefault();
        applySuggestion(suggestions[highlight]);
        return;
      }
      handleSearch();
    }
  };

  return (
    <div ref={rootRef} className="relative z-20 w-full min-w-0">
      <input
        type="text"
        role="combobox"
        aria-expanded={showPanel ? "true" : "false"}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && highlight >= 0 ? `${listId}-option-${highlight}` : undefined
        }
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={typedPlaceholder}
        autoComplete="off"
        className="h-10 min-h-10 w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-2 pl-3 pr-11 text-sm transition-all focus:border-green-500 focus:bg-white focus:outline-none sm:pl-4 sm:pr-12"
      />
      <button
        type="button"
        onClick={handleSearch}
        aria-label="Search"
        className="absolute right-0 top-0 z-10 flex h-10 min-h-10 w-10 min-w-10 items-center justify-center rounded-r-lg bg-primary transition-colors hover:bg-primary/90 cursor-pointer sm:w-11 sm:min-w-11"
      >
        <Search size={17} className="text-white" />
      </button>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((text, i) => (
            <li key={text} role="presentation">
              <button
                type="button"
                role="option"
                id={`${listId}-option-${i}`}
                aria-selected={highlight === i ? "true" : "false"}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestion(text);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={[
                  "flex w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-800 transition-colors sm:px-4",
                  highlight === i ? "bg-green-50 text-green-800" : "hover:bg-gray-50",
                ].join(" ")}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
