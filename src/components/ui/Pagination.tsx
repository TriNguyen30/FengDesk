import React, { useRef, useLayoutEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePagination, DOTS } from "@/hooks/usePagination";

export interface PaginationProps {
  onPageChange: (page: number) => void;
  totalCount: number;
  siblingCount?: number;
  currentPage: number;
  pageSize: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
  className = "",
}) => {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  });

  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLUListElement | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Measure the active button's position relative to the list so the
  // highlight pill can glide to it instead of popping in/out.
  useLayoutEffect(() => {
    const activeEl = itemRefs.current[currentPage];
    const listEl = listRef.current;
    if (activeEl && listEl) {
      const listRect = listEl.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: elRect.left - listRect.left,
        width: elRect.width,
      });
    }
  }, [currentPage, paginationRange.length]);

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => onPageChange(currentPage + 1);
  const onPrevious = () => onPageChange(currentPage - 1);
  const lastPage = paginationRange[paginationRange.length - 1];

  return (
    <ul
      ref={listRef}
      className={`relative flex items-center space-x-1 ${className}`}
    >
      {/* Sliding active-page indicator */}
      {indicator && (
        <span
          aria-hidden
          className="absolute top-0 h-9 rounded-md bg-primary transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}

      <li>
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-all duration-200 ease-out hover:bg-gray-50 hover:text-gray-700 hover:-translate-x-0.5 active:scale-90 active:duration-100 disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-x-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-active:-translate-x-0.5" />
        </button>
      </li>

      {paginationRange.map((pageNumber, idx) => {
        if (pageNumber === DOTS) {
          return (
            <li
              key={`dots-${idx}`}
              className="flex h-9 w-9 items-center justify-center text-gray-400 dark:text-gray-500"
            >
              <span className="animate-pulse tracking-widest">&#8230;</span>
            </li>
          );
        }

        const page = pageNumber as number;
        const isActive = page === currentPage;

        return (
          <li
            key={idx}
            style={{ animation: `pg-fade-in 260ms ease-out ${idx * 25}ms both` }}
          >
            <button
              ref={(el) => (itemRefs.current[page] = el)}
              onClick={() => onPageChange(page)}
              className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ease-out active:scale-90 active:duration-100 cursor-pointer ${isActive
                  ? "text-white"
                  : "border border-transparent text-gray-600 hover:bg-gray-100 hover:scale-105 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          </li>
        );
      })}

      <li>
        <button
          onClick={onNext}
          disabled={currentPage === lastPage}
          className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-all duration-200 ease-out hover:bg-gray-50 hover:text-gray-700 hover:translate-x-0.5 active:scale-90 active:duration-100 disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-x-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-active:translate-x-0.5" />
        </button>
      </li>

      <style>{`
        @keyframes pg-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </ul>
  );
};

export default Pagination;