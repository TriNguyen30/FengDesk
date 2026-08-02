export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
  isActive: boolean;
  tokenVersion: number;
  createdAt: string;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UpdateUserRolesPayload {
  roles: string[];
  reason: string;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
  reason: string;
}

export interface AdminUserAuditLog {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValueJson: string | null;
  newValueJson: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}
