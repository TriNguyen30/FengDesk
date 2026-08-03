import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { setAuthModal } from "@/features/auth/store/authSlice";
import {
  closeAiAssistant,
  openAiAssistant,
  selectAiAssistantIsOpen,
} from "@/features/chatbox/store/chatboxSlice";

/**
 * Mở/đóng drawer trợ lý AI từ bất kỳ đâu (Navbar, CTA trang chủ…).
 * Khách chưa đăng nhập được đẩy sang modal đăng nhập thay vì mở drawer rỗng.
 */
export function useAiAssistant() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isOpen = useAppSelector(selectAiAssistantIsOpen);

  const open = useCallback(() => {
    if (!user) {
      dispatch(setAuthModal("login"));
      toast.info(t("navbar.login_required_ai"));
      return;
    }
    dispatch(openAiAssistant());
  }, [dispatch, t, user]);

  const close = useCallback(() => dispatch(closeAiAssistant()), [dispatch]);

  return { isOpen, open, close };
}
