export interface ApiResponse<T> {
    data: T;
    isSuccess: boolean;
    statusCode: number;
    message: string | null;
    errors: string[] | null;
}

export interface Tag {
    id: string;
    name: string;
    description: string | null;
}