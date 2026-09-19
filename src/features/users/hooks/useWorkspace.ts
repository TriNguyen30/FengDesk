import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspaces,
  getWorkspaceById,
  getWorkspaceTypes,
  getStyles,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  setDefaultWorkspace,
  getWorkspaceElementAnalysis,
} from "../api/workspace.api";
import type { CreateWorkspaceDto, UpdateWorkspaceDto } from "../types/workspace";

export function useWorkspaces() {
  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });

  return {
    workspaces: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useWorkspaceDetail(id?: string) {
  const query = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getWorkspaceById(id);
    },
    enabled: !!id,
  });

  return {
    workspace: query.data ?? null,
    status: query.status,
    query,
  };
}

export function useWorkspaceTypes() {
  const query = useQuery({
    queryKey: ["workspaceTypes"],
    queryFn: getWorkspaceTypes,
  });

  return {
    workspaceTypes: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useStyles() {
  const query = useQuery({
    queryKey: ["styles"],
    queryFn: getStyles,
  });

  return {
    styles: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspaceDto) => createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceDto }) =>
      updateWorkspace(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.id] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
    },
  });
}

export function useSetDefaultWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultWorkspace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
    },
  });
}

export function useWorkspaceElementAnalysis(id?: string) {
  const query = useQuery({
    queryKey: ["workspace", id, "element-analysis"],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getWorkspaceElementAnalysis(id);
    },
    enabled: !!id,
  });
  return { analysis: query.data ?? null, status: query.status, query };
}

/**
 * % tương thích của NHIỀU phòng cùng lúc (sidebar chọn phòng). Cùng key với
 * `useWorkspaceElementAnalysis` nên phòng đang mở không tốn thêm request; các phòng khác tải nền.
 * `undefined` = đang tải, `null` = lỗi.
 */
export function useWorkspaceCompatibilities(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["workspace", id, "element-analysis"],
      queryFn: () => getWorkspaceElementAnalysis(id),
    })),
  });
  return new Map<string, number | null | undefined>(
    ids.map((id, i) => {
      const r = results[i];
      return [id, r.status === "error" ? null : r.data?.compatibilityPercent];
    }),
  );
}
