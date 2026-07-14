import { SearchBar } from "@/components/ui/Search";

export function Default() {
  return <SearchBar placeholder="Bạn cần tìm cây gì?" onSearch={() => {}} />;
}

export function WithSuggestions() {
  return <SearchBar placeholder="cây" onSearch={() => {}} />;
}
