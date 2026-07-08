import fetchHttpClient from "@/lib/httpClient";
import {
  Workspace,
  WorkspaceType,
  Style,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceElementAnalysis,
} from "../types/workspace";
import type { ApiResponse } from "@/types/api";

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Workspace[]>>("/workspace");
  return response.data.data;
};

export const getWorkspaceById = async (id: string): Promise<Workspace> => {
  const response = await fetchHttpClient.get<ApiResponse<Workspace>>(`/workspace/${id}`);
  return response.data.data;
};

export const getWorkspaceTypes = async () => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceType[]>>("/workspace-types");
  return response.data.data;
};

export const getStyles = async (): Promise<Style[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Style[]>>("/styles");
  return response.data.data;
};

export const createWorkspace = async (data: CreateWorkspaceDto): Promise<Workspace> => {
  const response = await fetchHttpClient.post<ApiResponse<Workspace>>("/workspace", data);
  return response.data.data;
};

export const updateWorkspace = async (id: string, data: UpdateWorkspaceDto): Promise<Workspace> => {
  const response = await fetchHttpClient.put<ApiResponse<Workspace>>(`/workspace/${id}`, data);
  return response.data.data;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await fetchHttpClient.delete(`/workspace/${id}`);
};

export const setDefaultWorkspace = async (id: string): Promise<Workspace> => {
  const response = await fetchHttpClient.patch<ApiResponse<Workspace>>(
    `/workspace/${id}/set-default`,
  );
  return response.data.data;
};

export const getWorkspaceElementAnalysis = async (
  id: string,
): Promise<WorkspaceElementAnalysis> => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceElementAnalysis>>(
    `/workspace/${id}/element-analysis`,
  );
  return response.data.data;
};
