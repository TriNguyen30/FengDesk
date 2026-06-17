import fetchHttpClient from "@/lib/httpClient";
import { Workspace, WorkspaceType, Style, CreateWorkspaceDto } from "../types/workspace";
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
