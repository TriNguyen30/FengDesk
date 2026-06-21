import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../api/address.api";
import type { CreateAddressDto, UpdateAddressDto } from "../types/address";

export function useAddresses() {
  const query = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });

  return {
    addresses: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useAddressDetail(id?: string) {
  const query = useQuery({
    queryKey: ["address", id],
    queryFn: () => {
      if (!id) throw new Error("No ID provided");
      return getAddressById(id);
    },
    enabled: !!id,
  });

  return {
    address: query.data ?? null,
    status: query.status,
    query,
  };
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressDto) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressDto }) => updateAddress(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address", variables.id] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["address", id] });
    },
  });
}
