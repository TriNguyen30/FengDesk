export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

export interface Shop {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopDto {
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
}

export interface UpdateShopDto {
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
}

export interface StoreAddress {
  id: string;
  wardId: string;
  streetAddress: string;
  recipientName: string;
  recipientPhone: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

export interface CreateStoreAddressDto {
  wardId: string;
  streetAddress: string;
  recipientName: string;
  recipientPhone: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

export interface UpdateStoreAddressDto {
  wardId: string;
  streetAddress: string;
  recipientName: string;
  recipientPhone: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

export interface StoreStaff {
  id: string;
  storeId: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
  };
}

export interface AssignStaffDto {
  userId: string;
  role: string;
}
