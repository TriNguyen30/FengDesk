import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchContextType = {
  keyword: string;
  setKeyword: (v: string) => void;
  clear: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function SearchProvider({ children }: { children: ReactNode }) {
  const [keyword, setKeyword] = useState("");

  const value = useMemo(
    () => ({
      keyword,
      setKeyword,
      clear: () => setKeyword(""),
    }),
    [keyword],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}
