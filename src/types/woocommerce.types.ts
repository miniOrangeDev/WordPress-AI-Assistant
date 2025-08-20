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

export interface WCRevenueTotals {
  total_sales?: number;
  net_revenue?: number;
  orders_count?: number;
  items_sold?: number;
  refunds?: number;
  taxes?: number;
  shipping?: number;
  discounts?: number;
}

export interface WCRevenueIntervalPoint extends WCRevenueTotals {
  date: string; // ISO date
}

export interface WCRevenueStats {
  totals: WCRevenueTotals;
  intervals: WCRevenueIntervalPoint[];
}

export interface WCTopProductItem {
  product_id: number;
  name?: string;
  quantity: number;
  total: number; // revenue
}

export interface WCOrdersTotals {
  orders_count?: number;
  avg_order_value?: number;
  net_revenue?: number;
  refunds?: number;
}

export interface WCOrdersIntervalPoint extends WCOrdersTotals {
  date: string;
}

export interface WCOrdersStats {
  totals: WCOrdersTotals;
  intervals: WCOrdersIntervalPoint[];
}

export interface WCProductStatsPoint {
  date: string;
  product_id: number;
  quantity: number;
  net_revenue: number;
}


