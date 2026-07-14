// Design-sync preview stub for @/lib/axios — swapped in only for the
// claude.ai/design bundle (see .design-sync/tsconfig.dssync.json) so
// components that fetch on mount (CategoryBar, PopularCategories, etc.)
// render with realistic demo data instead of hitting a live backend.
import type { AxiosResponse } from "axios";

interface StubApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

function ok<T>(data: T): Promise<AxiosResponse<StubApiResponse<T>>> {
  return Promise.resolve({
    data: { data, isSuccess: true, statusCode: 200, message: null, errors: null },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as AxiosResponse["config"],
  } as AxiosResponse<StubApiResponse<T>>);
}

const demoCategories = [
  { id: "cat-indoor", name: "Cây phong thủy trong nhà", isActive: true },
  { id: "cat-outdoor", name: "Cây phong thủy ngoài trời", isActive: true },
  { id: "cat-pots", name: "Chậu & phụ kiện", isActive: true },
  { id: "cat-soil", name: "Đất & dinh dưỡng", isActive: true },
  { id: "cat-tools", name: "Dụng cụ làm vườn", isActive: true },
];

function dataFor(url: string): unknown {
  if (url.includes("categories")) return demoCategories;
  if (url.includes("notifications")) return { items: [], total: 0, page: 1, pageSize: 10 };
  if (url.includes("shops")) return [];
  return [];
}

const stub = {
  get: (url: string) => ok(dataFor(url)),
  post: () => ok(null),
  put: () => ok(null),
  patch: () => ok(null),
  delete: () => ok(true),
};

export default stub;
