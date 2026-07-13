import { z } from "zod";

export const locationTypes = [
  "Home",
  "Office",
  "Cafe",
  "Studio",
  "Coworking",
  "School",
  "Outdoor",
  "Hotel",
  "Other",
] as const;
export const lightingTypes = ["Natural", "Artificial", "Mixed", "Dim"] as const;
export const deskTypes = ["Sitting", "Standing", "StandingSitting", "LShape", "Corner", "Other"] as const;
export const compassDirections = [
  "North",
  "Northeast",
  "East",
  "Southeast",
  "South",
  "Southwest",
  "West",
  "Northwest",
] as const;
export const workPurposes = [
  "Office",
  "Study",
  "Creative",
  "Reading",
  "Gaming",
  "Cooking",
  "Dining",
  "Relaxation",
  "Sleep",
  "Childcare",
  "Exercise",
  "Mixed",
  "Other",
] as const;

/**
 * Form review workspace (WorkspaceReviewForm) — dùng chung cho tạo/sửa thủ công lẫn review draft AI intake.
 * Field optional giữ dạng chuỗi rỗng "" = "chưa rõ" (thay vì undefined) để bind trực tiếp vào <select>/<input>.
 */
export const workspaceFormSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên không gian làm việc"),
    workspaceTypeId: z.string().min(1, "Vui lòng chọn loại không gian làm việc"),
    styleCode: z.string().min(1, "Vui lòng chọn phong cách"),
    locationType: z.enum(locationTypes),
    workPurpose: z.enum(workPurposes),
    noDesk: z.boolean(),
    lighting: z.string(),
    deskType: z.string(),
    deskOrientation: z.string(),
    roomFacingDirection: z.string(),
    deskArea: z.string(),
    isDefault: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.noDesk || data.deskArea.trim() === "") return true;
      const n = Number(data.deskArea);
      return !Number.isNaN(n) && n > 0;
    },
    { message: "Diện tích bàn phải là số dương", path: ["deskArea"] },
  );

export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;
