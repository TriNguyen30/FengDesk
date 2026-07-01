import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mail, Phone, Search, UserCircle2 } from "lucide-react";
import { searchUsersRequest } from "@/features/shop/api/shop.api";
import type { UserSearchItem } from "@/features/shop/types/shop";

interface Props {
  /** ID của user đã chọn (để hiển thị + submit ra ngoài). */
  value: UserSearchItem | null;
  onChange: (user: UserSearchItem | null) => void;
  /** Danh sách user KHÔNG cho chọn (đã là staff / đang có lời mời). Map staffId → nhãn hiển thị. */
  disabledUserIds?: Record<string, string>;
  disabled?: boolean;
  autoFocus?: boolean;
}

const MIN_QUERY = 3;
const DEBOUNCE_MS = 300;

export default function UserSearchCombobox({
  value,
  onChange,
  disabledUserIds = {},
  disabled,
  autoFocus,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search — chỉ chạy khi query đủ dài; abort request cũ khi query đổi.
  useEffect(() => {
    if (value) return; // đã chọn user rồi thì không search nữa
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setLoading(false);
      setErrorMsg(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchUsersRequest(trimmed);
        if (cancelled) return;
        if (res.isSuccess && res.data) {
          setResults(res.data);
          setErrorMsg(null);
        } else {
          setResults([]);
          setErrorMsg(res.message || "Không tìm được người dùng.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setResults([]);
          setErrorMsg("Lỗi khi tìm kiếm.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, value]);

  // Close dropdown khi click ra ngoài.
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setHighlight(0);
  }, [results]);

  const selectableResults = useMemo(
    () => results.filter((u) => !disabledUserIds[u.id]),
    [results, disabledUserIds],
  );

  const handleSelect = (user: UserSearchItem) => {
    if (disabledUserIds[user.id]) return;
    onChange(user);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (value) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const pick = results[highlight];
      if (pick && !disabledUserIds[pick.id]) {
        e.preventDefault();
        handleSelect(pick);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // ── Đã chọn user → hiển thị chip readonly + nút xoá.
  if (value) {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle2 size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{value.fullName}</p>
            <p className="truncate text-xs text-gray-500">{value.email}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
          >
            Đổi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="Tìm theo email / họ tên / số điện thoại…"
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          autoComplete="off"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {query.trim().length < MIN_QUERY ? (
            <div className="px-3 py-3 text-xs text-gray-500">
              Nhập tối thiểu {MIN_QUERY} ký tự để bắt đầu tìm.
            </div>
          ) : loading && results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-500">Đang tìm…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-500">
              {errorMsg || "Không tìm thấy người dùng phù hợp."}
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((u, idx) => {
                const disabledLabel = disabledUserIds[u.id];
                const isDisabled = !!disabledLabel;
                const isHighlighted = idx === highlight;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onMouseEnter={() => !isDisabled && setHighlight(idx)}
                      onClick={() => handleSelect(u)}
                      disabled={isDisabled}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        isHighlighted && !isDisabled ? "bg-primary/5" : ""
                      } ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-primary/5"}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserCircle2 size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{u.fullName}</p>
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate">{u.email}</span>
                          {u.phone && (
                            <>
                              <Phone size={11} className="shrink-0" />
                              <span className="truncate">{u.phone}</span>
                            </>
                          )}
                        </p>
                      </div>
                      {isDisabled && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          {disabledLabel}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {selectableResults.length === 0 && (
                <li className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                  Tất cả kết quả đều đã được mời hoặc là nhân viên hiện tại.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
