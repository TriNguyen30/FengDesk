export type CartProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
};

export type CartLine = {
  product: CartProduct;
  quantity: number;
};

export type CartState = {
  items: CartLine[];
};
