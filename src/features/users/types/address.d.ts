export interface Address {
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

export interface CreateAddressDto {
    wardId: string;
    streetAddress: string;
    recipientName: string;
    recipientPhone: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    label: string;
}

export interface UpdateAddressDto {
    wardId: string;
    streetAddress: string;
    recipientName: string;
    recipientPhone: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    label: string;
}