import { useMutation } from "@tanstack/react-query";
import { parseWorkspaceDescription } from "../api/workspaceIntake.api";

/** AI intake: mô tả không gian bằng lời → draft prefill form. Stateless — không lưu DB. */
export function useParseWorkspace() {
  return useMutation({
    mutationFn: (description: string) => parseWorkspaceDescription(description),
  });
}
