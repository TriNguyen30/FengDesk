import { Search, Filter, Plus, X } from "lucide-react";

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchField?: "name" | "email";
  onSearchFieldChange?: (field: "name" | "email") => void;
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
  showAdd?: boolean;
  onAddClick?: () => void;
  addLabel?: string;
}

export default function AdminFilterBar({
  searchPlaceholder = "Tìm kiếm...",
  searchValue,
  onSearchChange,
  onClearSearch,
  searchField,
  onSearchFieldChange,
  selectedRole,
  onRoleChange,
  showAdd = true,
  onAddClick,
  addLabel = "Thêm mới",
}: AdminFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex">
        {onSearchFieldChange && (
          <select
            value={searchField}
            onChange={(e) => onSearchFieldChange(e.target.value as "name" | "email")}
            className="h-10 appearance-none rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer border-e-transparent"
          >
            <option value="name">Tên</option>
            <option value="email">Email</option>
          </select>
        )}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${onSearchFieldChange ? 'hidden' : ''}`} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`h-10 w-full border border-slate-300 bg-white pr-8 text-sm placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64 transition-all ${
              onSearchFieldChange ? 'rounded-r-lg pl-3' : 'rounded-lg pl-9'
            }`}
          />
          {searchValue && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      {onRoleChange && (
        <div className="relative">
          <select
            value={selectedRole || ""}
            onChange={(e) => onRoleChange(e.target.value)}
            className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-10 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Customer">Customer</option>
            <option value="Manager">Manager</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
            <option value="GardenOwner">GardenOwner</option>
          </select>
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      )}

      {showAdd && (
        <button 
          onClick={onAddClick}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{addLabel}</span>
        </button>
      )}
    </div>
  );
}
