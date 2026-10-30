import { useLayoutEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import { loginWithGoogleRequest } from "@/features/auth/api/auth.api";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getAuthErrorMessage } from "@/features/auth/utils/getAuthErrorMessage";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const googleButtonClassName =
  "flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition group-hover:bg-gray-50 group-active:bg-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer";

function GoogleButtonLabel() {
  return (
    <div className="flex items-center gap-2">
      <GoogleIcon />
      <span>Tiếp tục với Google</span>
    </div>
  );
}

/** GIS large button is ~40px tall and max 400px wide — scale it to cover the custom button. */
const GSI_BUTTON_HEIGHT = 40;

function GoogleLoginOverlay({
  onSuccess,
}: {
  onSuccess: (credentialResponse: CredentialResponse) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 320, height: 44 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const sync = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBox({ width: rect.width, height: rect.height });
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const gsiWidth = Math.max(120, Math.min(400, Math.round(box.width)));
  const scaleX = box.width / gsiWidth;
  const scaleY = box.height / GSI_BUTTON_HEIGHT;

  return (
    <div ref={hostRef} className="absolute inset-0 z-10 overflow-hidden opacity-0">
      <div
        className="origin-top-left"
        style={{
          width: gsiWidth,
          height: GSI_BUTTON_HEIGHT,
          transform: `scale(${scaleX}, ${scaleY})`,
        }}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.")}
          theme="outline"
          size="large"
          shape="rectangular"
          text="continue_with"
          locale="vi"
          width={gsiWidth}
        />
      </div>
    </div>
  );
}

type SocialAuthButtonsProps = {
  dividerLabel?: string;
  /** Gọi sau khi đăng nhập Google thành công — dùng để đóng modal/chuyển hướng ở component cha. */
  onSuccess?: () => void;
};

export default function SocialAuthButtons({
  dividerLabel = "HOẶC",
  onSuccess,
}: SocialAuthButtonsProps) {
  const { persistSession } = useAuthSession();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Không lấy được thông tin đăng nhập từ Google.");
      return;
    }

    try {
      const response = await loginWithGoogleRequest({ idToken: credentialResponse.credential });

      if (!response.isSuccess || !response.data) {
        toast.error(response.message || "Đăng nhập Google thất bại");
        return;
      }

      persistSession(response.data);
      toast.success(response.message || "Đăng nhập thành công");
      onSuccess?.();

      // Staff/Manager/Admin → vào khu điều hành. role có thể là chuỗi nhiều giá trị ("Customer, Staff").
      const roles = (response.data.user.role ?? "").split(",").map((r) => r.trim());
      if (roles.includes("Admin")) {
        window.location.assign("/admin");
      } else if (roles.some((r) => r === "Staff" || r === "Manager")) {
        window.location.assign("/manager");
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Đăng nhập Google thất bại. Vui lòng thử lại."));
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-gray-400 sm:gap-3">
        <div className="h-px min-w-0 flex-1 bg-gray-200" />
        <span className="max-w-[45%] shrink-0 text-center leading-tight sm:max-w-none">
          {dividerLabel}
        </span>
        <div className="h-px min-w-0 flex-1 bg-gray-200" />
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="group relative w-full">
          {googleConfigured ? (
            <>
              <div className={googleButtonClassName} aria-hidden>
                <GoogleButtonLabel />
              </div>
              <GoogleLoginOverlay onSuccess={handleGoogleSuccess} />
            </>
          ) : (
            <button
              type="button"
              onClick={() => toast.info("Đăng nhập Google chưa được cấu hình.")}
              className={googleButtonClassName}
            >
              <GoogleButtonLabel />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
