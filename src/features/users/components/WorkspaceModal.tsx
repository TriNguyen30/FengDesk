import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getElementInputVocabulary, getStyles, getWorkspaceTypes } from "../api/workspace.api";
import { useWorkspaceIntake } from "../hooks/useWorkspaceIntake";
import { useWorkspaceIntakeDraft } from "../hooks/useWorkspaceIntakeDraft";
import type { WorkspaceFormValues } from "../schemas/workspace-schema";
import type {
  ElementInputVocabulary,
  Style,
  Workspace,
  WorkspaceProfileInputDto,
  WorkspaceType,
} from "../types/workspace";
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

  // Bản nháp lần trước (chỉ create mode). Đọc 1 lần lúc mount, dùng làm giá trị khởi tạo.
  const draftStore = useWorkspaceIntakeDraft(!isEditMode);
  const saved = draftStore.initial;

  const [step, setStep] = useState<Step>(
    isEditMode ? "review" : (saved?.step ?? "describe"),
  );
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  // Nội dung nháp đang giữ trong bộ nhớ — cả 2 bước cùng ghi vào đây rồi đẩy xuống localStorage.
  const draftRef = useRef({
    describe: saved?.describe ?? { description: "", imageUrls: [] as string[], deepThink: false },
    review: saved?.review,
  });

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
      // Create mode: quay lại ĐÚNG bước user đang dở (nháp), thay vì luôn về bước mô tả.
      setStep(isEditMode ? "review" : (draftRef.current.review ? "review" : "describe"));
      // intake là trạng thái của LƯỢT CHẠY AI (operationId, tiến trình) — không sống qua lần mở mới,
      // nên vẫn reset. Nội dung user gõ thì do nháp lo, không liên quan.
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

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

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

  // ── Ghi nháp ────────────────────────────────────────────────────────────
  // Hai bước con báo thay đổi về đây; hook tự debounce trước khi chạm localStorage.

  const persist = useCallback(
    (nextStep: Step) => {
      draftStore.save({
        step: nextStep,
        describe: draftRef.current.describe,
        review: draftRef.current.review,
      });
    },
    [draftStore],
  );

  const handleDescribeChange = useCallback(
    (d: { description: string; imageUrls: string[]; deepThink: boolean }) => {
      draftRef.current.describe = d;
      persist(step);
    },
    [persist, step],
  );

  const handleReviewChange = useCallback(
    (values: WorkspaceFormValues, inputs: WorkspaceProfileInputDto[]) => {
      draftRef.current.review = { values, inputs };
      persist("review");
    },
    [persist],
  );

  /**
   * Đóng modal bằng nút X / bấm nền: GIỮ nháp.
   * Đây là chỗ user hay bấm nhầm nhất — mất công gõ vì một cú click là quá đắt.
   */
  const handleDismiss = () => {
    draftStore.flush();
    onClose();
  };

  /**
   * Quay lại bước mô tả. Giữ nguyên mọi thứ user đã nhập ở bước 2 (nháp lo phần đó) và cũng
   * KHÔNG hủy lượt AI đang chạy — quay lại rồi sang lại vẫn thấy tiến trình/draft như cũ.
   */
  const handleBackToDescribe = () => {
    setStep("describe");
    persist("describe");
  };

  /** Bấm "Hủy" là ý định RÕ RÀNG muốn bỏ → xóa nháp. */
  const handleCancel = () => {
    draftStore.clear();
    draftRef.current = { describe: { description: "", imageUrls: [], deepThink: false }, review: undefined };
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={handleDismiss}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-[101] w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex min-w-0 items-center gap-2">
            {/* Quay lại bước mô tả — chỉ có ở create mode. Nội dung đã gõ được nháp giữ nguyên,
                nên đi tới đi lui giữa 2 bước không mất gì. */}
            {!isEditMode && step === "review" && (
              <button
                type="button"
                onClick={handleBackToDescribe}
                title="Quay lại phần mô tả"
                aria-label="Quay lại phần mô tả"
                className="-ml-1.5 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="truncate text-lg font-bold text-gray-900">
              {isEditMode
                ? "Chỉnh sửa không gian làm việc"
                : step === "describe"
                  ? "Mô tả không gian làm việc"
                  : "Kiểm tra & lưu"}
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            title="Đóng — nội dung đang nhập vẫn được giữ lại"
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
            initialDescription={draftRef.current.describe.description}
            initialImageUrls={draftRef.current.describe.imageUrls}
            initialDeepThink={draftRef.current.describe.deepThink}
            onDraftChange={handleDescribeChange}
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
              initialValues={isEditMode ? null : draftRef.current.review?.values}
              initialInputs={isEditMode ? null : draftRef.current.review?.inputs}
              onDraftChange={handleReviewChange}
              onSuccess={() => {
                // Lưu được rồi thì nháp hết ý nghĩa.
                draftStore.clear();
                onSuccess();
                onClose();
              }}
              onCancel={handleCancel}
            />
          </>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
