import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { getStyles, getWorkspaceTypes } from "../api/workspace.api";
import { useParseWorkspace } from "../hooks/useParseWorkspace";
import type { Style, Workspace, WorkspaceProfileDraft, WorkspaceType } from "../types/workspace";
import WorkspaceDescribeStep from "./WorkspaceDescribeStep";
import WorkspaceReviewForm from "./WorkspaceReviewForm";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspace?: Workspace | null; // truyền vào = edit mode (bỏ qua bước mô tả)
}

type Step = "describe" | "review";

export default function WorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}: WorkspaceModalProps) {
  const isEditMode = !!workspace;
  const [step, setStep] = useState<Step>(isEditMode ? "review" : "describe");
  const [draft, setDraft] = useState<WorkspaceProfileDraft | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const parseWorkspace = useParseWorkspace();

  // Mở modal (lần đầu hoặc đổi workspace đang sửa) → reset bước/draft ngay trong render — mẫu React
  // "adjusting state when a prop changes" (setState trong render, KHÔNG trong effect) tránh cascading render.
  const currentKey = isOpen ? (workspace?.id ?? "new") : null;
  if (currentKey !== sessionKey) {
    setSessionKey(currentKey);
    if (currentKey !== null) {
      setStep(isEditMode ? "review" : "describe");
      setDraft(null);
      parseWorkspace.reset();
    }
  }

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [typesData, stylesData] = await Promise.all([getWorkspaceTypes(), getStyles()]);
      setWorkspaceTypes(typesData || []);
      setStyles(stylesData || []);
    } catch (error) {
      console.error("Error fetching options", error);
      toast.error("Không thể tải danh sách tùy chọn");
    } finally {
      setLoadingOptions(false);
    }
  };

  // Nạp danh sách loại không gian/phong cách mỗi lần mở modal (không cache — danh mục ít thay đổi
  // nhưng có thể khác theo user). WorkspaceModal không unmount giữa các lần mở (điều khiển bởi isOpen
  // của cha) nên không tách được thành mount-effect thuần — fetch-on-prop-change là hợp lệ ở đây.
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOptions();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = (description: string) => {
    parseWorkspace.mutate(description, {
      onSuccess: (result) => {
        setDraft(result);
        setStep("review");
      },
      onError: (error) => {
        const message = isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        toast.error(message || "Trợ lý đang bận, bạn có thể điền form thủ công.");
      },
    });
  };

  const handleSkip = () => {
    setDraft(null);
    setStep("review");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode
              ? "Chỉnh sửa không gian làm việc"
              : step === "describe"
                ? "Mô tả không gian làm việc"
                : "Kiểm tra & lưu"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {step === "describe" ? (
          <WorkspaceDescribeStep
            onAnalyze={handleAnalyze}
            onSkip={handleSkip}
            isAnalyzing={parseWorkspace.isPending}
          />
        ) : loadingOptions ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <WorkspaceReviewForm
            workspace={workspace}
            draft={draft}
            workspaceTypes={workspaceTypes}
            styles={styles}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
