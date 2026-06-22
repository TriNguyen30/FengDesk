import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspaces,
  getWorkspaceById,
  getWorkspaceTypes,
  getStyles,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  setDefaultWorkspace,
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
