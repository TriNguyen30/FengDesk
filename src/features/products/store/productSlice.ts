import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import { productApi } from "../api/product.api";
import type { GetProductsParams, Product, ProductDetail } from "../types/product";

type LoadingStatus = "idle" | "loading" | "failed";

interface ProductListEntry {
  items: Product[];
  status: LoadingStatus;
  totalCount: number;
}

interface ProductState {
  lists: Record<string, ProductListEntry>;
  details: Record<string, ProductDetail>;
  detailStatus: Record<string, LoadingStatus>;
}

export function getProductListKey(params: GetProductsParams = {}): string {
  return JSON.stringify({
    storeId: params.storeId ?? null,
    categoryId: params.categoryId ?? null,
    tagId: params.tagId ?? null,
    search: params.search ?? null,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  });
}

const initialState: ProductState = {
  lists: {},
  details: {},
  detailStatus: {},
};

export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (params: GetProductsParams = {}) => {
    const response = await productApi.getProducts(params);
    return { key: getProductListKey(params), data: response.data };
  },
);

export const fetchProductById = createAsyncThunk("product/fetchProductById", async (id: string) => {
  const response = await productApi.getProductById(id);
  return { id, data: response.data };
});

export const fetchProductDetailsByIds = createAsyncThunk(
  "product/fetchProductDetailsByIds",
  async (ids: string[], { getState }) => {
    const state = getState() as RootState;
    const missingIds = ids.filter(
      (id) => id && !state.product.details[id] && state.product.detailStatus[id] !== "loading",
    );

    const results: Record<string, ProductDetail> = {};

    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const response = await productApi.getProductById(id);
          if (response.data.isSuccess && response.data.data) {
            results[id] = response.data.data;
          }
        } catch (error) {
          console.error(`Failed to fetch product ${id}`, error);
        }
      }),
    );

    return results;
  },
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        const key = getProductListKey(action.meta.arg);
        const entry = state.lists[key];
        state.lists[key] = {
          items: entry?.items ?? [],
          status: "loading",
          totalCount: entry?.totalCount ?? 0,
        };
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { key, data } = action.payload;
        if (data.isSuccess) {
          state.lists[key] = {
            items: data.data.items,
            status: "idle",
            totalCount: data.data.totalCount,
          };
        } else {
          state.lists[key] = {
            items: [],
            status: "failed",
            totalCount: 0,
          };
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        const key = getProductListKey(action.meta.arg);
        const entry = state.lists[key];
        state.lists[key] = {
          items: entry?.items ?? [],
          status: "failed",
          totalCount: entry?.totalCount ?? 0,
        };
      })
      .addCase(fetchProductById.pending, (state, action) => {
        state.detailStatus[action.meta.arg] = "loading";
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        if (data.isSuccess && data.data) {
          state.details[id] = data.data;
          state.detailStatus[id] = "idle";
        } else {
          state.detailStatus[id] = "failed";
        }
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.detailStatus[action.meta.arg] = "failed";
      })
      .addCase(fetchProductDetailsByIds.fulfilled, (state, action) => {
        Object.assign(state.details, action.payload);
        Object.keys(action.payload).forEach((id) => {
          state.detailStatus[id] = "idle";
        });
      });
  },
});

export default productSlice.reducer;

export const selectProductList =
  (params: GetProductsParams = {}) =>
  (state: RootState) =>
    state.product.lists[getProductListKey(params)];

export const selectProductDetail = (id: string) => (state: RootState) => state.product.details[id];

export const selectProductDetailStatus = (id: string) => (state: RootState) =>
  state.product.detailStatus[id] ?? "idle";

export const selectProductPrimaryImage = (productId: string) => (state: RootState) => {
  const detail = state.product.details[productId];
  return detail?.images?.[0]?.url;
};
