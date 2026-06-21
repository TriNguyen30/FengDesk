import { useQuery } from "@tanstack/react-query";
import { getProvinces, getDistrictsByProvinceId, getWardsByDistrictId } from "../api/location.api";

export function useProvinces() {
  const query = useQuery({
    queryKey: ["provinces"],
    queryFn: getProvinces,
  });

  return {
    provinces: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useDistricts(provinceId?: string) {
  const query = useQuery({
    queryKey: ["districts", provinceId],
    queryFn: () => {
      if (!provinceId) throw new Error("No province ID provided");
      return getDistrictsByProvinceId(provinceId);
    },
    enabled: !!provinceId,
  });

  return {
    districts: query.data ?? [],
    status: query.status,
    query,
  };
}

export function useWards(districtId?: string) {
  const query = useQuery({
    queryKey: ["wards", districtId],
    queryFn: () => {
      if (!districtId) throw new Error("No district ID provided");
      return getWardsByDistrictId(districtId);
    },
    enabled: !!districtId,
  });

  return {
    wards: query.data ?? [],
    status: query.status,
    query,
  };
}
