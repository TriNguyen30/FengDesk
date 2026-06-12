type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function OtpInput({ value, onChange, error }: OtpInputProps) {
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = digits
        .map((d, idx) => (idx === i ? "" : d.trim()))
        .join("")
        .trimEnd();
      onChange(next);
      if (i > 0) {
        (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
      }
    }
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = digits
      .map((d, idx) => (idx === i ? digit : d.trim()))
      .join("")
      .replace(/\s/g, "");
    onChange(next);
    if (digit && i < 5) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const numericData = pastedData.replace(/\D/g, "").slice(0, 6);
    if (numericData) {
      onChange(numericData);
      const nextFocusIndex = Math.min(numericData.length, 5);
      (document.getElementById(`otp-${nextFocusIndex}`) as HTMLInputElement)?.focus();
    }
  };

  return (
    <div>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d.trim()}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "otp-error" : undefined}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            className={[
              "h-11 w-full min-w-0 rounded-lg border text-center text-base font-semibold text-gray-900 outline-none transition focus:ring-2 focus:ring-green-600/20 sm:h-12 sm:rounded-xl sm:text-lg",
              error
                ? "border-danger focus:border-danger"
                : "border-gray-200 focus:border-green-600",
            ].join(" ")}
          />
        ))}
      </div>
      {error ? (
        <p id="otp-error" className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
