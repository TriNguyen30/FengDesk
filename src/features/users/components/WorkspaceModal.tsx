import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getElementInputVocabulary, getStyles, getWorkspaceTypes } from "../api/workspace.api";
import { useWorkspaceIntake } from "../hooks/useWorkspaceIntake";
import type { ElementInputVocabulary, Style, Workspace, WorkspaceType } from "../types/workspace";
import WorkspaceDescribeStep from "./WorkspaceDescribeStep";
import WorkspaceIntakeProgress from "./WorkspaceIntakeProgress";
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
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [inputVocabulary, setInputVocabulary] = useState<ElementInputVocabulary | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // AI intake chạy nền: bấm phân tích → vào review ngay, draft về sau qua realtime (SignalR) tự prefill.
  const intake = useWorkspaceIntake();

  // Mở modal (lần đầu hoặc đổi workspace đang sửa) → reset bước/draft ngay trong render — mẫu React
  // "adjusting state when a prop changes" (setState trong render, KHÔNG trong effect) tránh cascading render.
  const currentKey = isOpen ? (workspace?.id ?? "new") : null;
  if (currentKey !== sessionKey) {
    setSessionKey(currentKey);
    if (currentKey !== null) {
      setStep(isEditMode ? "review" : "describe");
      intake.reset();
    }
  }

  // AI báo lỗi giữa chừng → toast (banner tiến trình cũng hiện thông báo inline).
  useEffect(() => {
    if (intake.status === "failed" && step === "review" && intake.error) toast.error(intake.error);
  }, [intake.status, intake.error, step]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [typesData, stylesData, vocabData] = await Promise.all([
        getWorkspaceTypes(),
        getStyles(),
        getElementInputVocabulary(),
      ]);
      setWorkspaceTypes(typesData || []);
      setStyles(stylesData || []);
      setInputVocabulary(vocabData || null);
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

  const handleAnalyze = async (description: string, imageUrls?: string[], think?: boolean) => {
    try {
      await intake.start(description, imageUrls, think);
      // Không chờ LLM — vào thẳng trang điền, banner tiến trình + draft sẽ tự về qua realtime.
      setStep("review");
    } catch {
      // Lỗi ngay ở bước gửi yêu cầu (chưa vào được hàng đợi) → ở lại bước mô tả để user thử lại.
      toast.error(intake.error || "Không bắt đầu được phân tích. Bạn có thể điền form thủ công.");
    }
  };

  const handleSkip = () => {
    intake.reset();
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
            isAnalyzing={intake.status === "starting"}
          />
        ) : loadingOptions ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {!isEditMode && (
              <WorkspaceIntakeProgress
                operationId={intake.operationId}
                status={intake.status}
                error={intake.error}
              />
            )}
            <WorkspaceReviewForm
              workspace={workspace}
              draft={intake.draft}
              workspaceTypes={workspaceTypes}
              styles={styles}
              inputVocabulary={inputVocabulary}
              onSuccess={() => {
                onSuccess();
                onClose();
              }}
              onCancel={onClose}
            />
          </>
        )}
      </div>
    </div>
  );
}
