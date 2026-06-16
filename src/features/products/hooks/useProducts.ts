import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProducts,
  fetchProductById,
  getProductListKey,
  selectProductDetail,
  selectProductDetailStatus,
  selectProductList,
} from "../store/productSlice";
import type { GetProductsParams } from "../types/product";

export function useProductList(params: GetProductsParams = {}) {
  const dispatch = useAppDispatch();
  const listKey = getProductListKey(params);
  const list = useAppSelector(selectProductList(params));

  useEffect(() => {
    dispatch(fetchProducts(params));
  }, [dispatch, listKey]);

  return {
    products: list?.items ?? [],
    loading: list?.status === "loading",
    failed: list?.status === "failed",
    totalCount: list?.totalCount ?? 0,
  };
}

export function useProductDetail(id?: string) {
  const dispatch = useAppDispatch();
  const product = useAppSelector(selectProductDetail(id ?? ""));
  const status = useAppSelector(selectProductDetailStatus(id ?? ""));

  useEffect(() => {
    if (id && !product && status === "idle") {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id, product, status]);

  return {
    product,
    loading: status === "loading" || (id && !product && status === "idle"),
    failed: status === "failed",
  };
}
