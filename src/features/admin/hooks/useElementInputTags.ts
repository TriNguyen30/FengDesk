import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { elementInputTagsApi } from "../api/elementInputTags.api";
import type {
  ElementInputKind,
  ElementInputTagFilters,
  UpdateElementInputTagPayload,
} from "../types/elementInputTag";

export const elementInputTagKeys = {
  all: ["elementInputTags"] as const,
  list: (filters: ElementInputTagFilters) => [...elementInputTagKeys.all, "list", filters] as const,
};

export function useElementInputTags(filters: ElementInputTagFilters) {
  return useQuery({
    queryKey: elementInputTagKeys.list(filters),
    // Bóc 2 lớp: AxiosResponse.data → ApiResponse.data → ElementInputTag[]
    queryFn: async () => (await elementInputTagsApi.getTags(filters)).data.data,
  });
}

export function useUpdateElementInputTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      code,
      payload,
    }: {
      kind: ElementInputKind;
      code: string;
      payload: UpdateElementInputTagPayload;
    }) => elementInputTagsApi.updateTag(kind, code, payload),
    // Sửa weight/nhãn đổi luôn cách tính vector phòng → làm mới cả list.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: elementInputTagKeys.all }),
  });
}

export function useDeleteElementInputTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, code }: { kind: ElementInputKind; code: string }) =>
      elementInputTagsApi.deleteTag(kind, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: elementInputTagKeys.all }),
  });
}
