import type { ReactNode } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function inputClassName(hasError?: boolean) {
  return [
    "min-h-11 w-full rounded-xl border px-3.5 py-2.5 text-base outline-none transition sm:text-sm",
    "focus:ring-2 focus:ring-green-600/20",
    hasError
      ? "border-danger focus:border-danger"
      : "border-gray-200 focus:border-green-600",
  ].join(" ");
}

export default function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: AuthFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {hint ? <div className="shrink-0 sm:text-right">{hint}</div> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}