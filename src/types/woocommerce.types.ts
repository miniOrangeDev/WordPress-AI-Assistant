export interface WCProductImage {
  id?: number;
  src?: string;
  name?: string;
  alt?: string;
}

export interface WCProduct {
  id: number;
  name: string;
  type?: string;
  status?: string;
  permalink?: string;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number; name?: string }>;
  tags?: Array<{ id: number; name?: string }>;
  images?: WCProductImage[];
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}


