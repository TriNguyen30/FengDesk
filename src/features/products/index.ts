export { useProductList, useProductDetail } from "./hooks/useProducts";
export {
  fetchProducts,
  fetchProductById,
  fetchProductDetailsByIds,
  selectProductList,
  selectProductDetail,
  selectProductDetailStatus,
  selectProductPrimaryImage,
  getProductListKey,
} from "./store/productSlice";
export { default as productReducer } from "./store/productSlice";
export type { Product, ProductDetail, GetProductsParams } from "./types/product";
