import type { WCAuthCredentials } from '../config/schema.js';
import type { WCOrdersStats, WCProductStatsPoint, WCRevenueStats, WCTopProductItem } from '../types/woocommerce.types.js';

function iso(d: Date): string {
  return d.toISOString();
}

function startOfUTCMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfUTCQuarter(d: Date): Date {
  const q = Math.floor(d.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(d.getUTCFullYear(), q, 1));
}

function startOfUTCYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

export class WooCommerceReportsService {
  private baseAnalyticsUrl: string;
  private baseV3Url: string;
  private authQuery: string;

  constructor(private credentials: WCAuthCredentials) {
    const base = credentials.siteUrl.replace(/\/$/, '');
    this.baseAnalyticsUrl = `${base}/wp-json/wc-analytics`;
    this.baseV3Url = `${base}/wp-json/wc/v3`;
    const key = encodeURIComponent(credentials.consumerKey);
    const secret = encodeURIComponent(credentials.consumerSecret);
    this.authQuery = `consumer_key=${key}&consumer_secret=${secret}`;
  }

  private resolveRange(range?: 'last_7_days' | 'last_30_days' | 'mtd' | 'qtd' | 'ytd' | 'custom', after?: string, before?: string) {
    if (range === 'custom' && after && before) return { after, before };
    const now = new Date();
    switch (range) {
      case 'last_7_days': {
        const b = now;
        const a = new Date(b.getTime() - 7 * 24 * 3600 * 1000);
        return { after: iso(a), before: iso(b) };
      }
      case 'last_30_days': {
        const b = now;
        const a = new Date(b.getTime() - 30 * 24 * 3600 * 1000);
        return { after: iso(a), before: iso(b) };
      }
      case 'mtd': {
        const a = startOfUTCMonth(now);
        return { after: iso(a), before: iso(now) };
      }
      case 'qtd': {
        const a = startOfUTCQuarter(now);
        return { after: iso(a), before: iso(now) };
      }
      case 'ytd': {
        const a = startOfUTCYear(now);
        return { after: iso(a), before: iso(now) };
      }
      default: {
        const b = now;
        const a = new Date(b.getTime() - 7 * 24 * 3600 * 1000);
        return { after: iso(a), before: iso(b) };
      }
    }
  }

  async getRevenueStats(params: { range?: 'last_7_days'|'last_30_days'|'mtd'|'qtd'|'ytd'|'custom'; after?: string; before?: string; interval?: 'day'|'week'|'month' }): Promise<WCRevenueStats> {
    const { after, before } = this.resolveRange(params.range, params.after, params.before);
    const interval = params.interval || 'day';
    // Try analytics first
    const analyticsUrl = `${this.baseAnalyticsUrl}/reports/revenue/stats?${this.authQuery}&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&interval=${interval}`;
    let res = await fetch(analyticsUrl);
    if (res.ok) {
      const data = await res.json();
      const totals = data?.totals || {};
      const intervals = (data?.intervals || []).map((p: any) => ({
        date: p.date,
        total_sales: Number(p.subtotals?.gross_sales || 0),
        net_revenue: Number(p.subtotals?.net_revenue || 0),
        orders_count: Number(p.subtotals?.orders_count || 0),
        items_sold: Number(p.subtotals?.items_sold || 0),
        refunds: Number(p.subtotals?.refunds || 0),
        taxes: Number(p.subtotals?.taxes || 0),
        shipping: Number(p.subtotals?.shipping || 0),
        discounts: Number(p.subtotals?.discounts || 0),
      }));
      return {
        totals: {
          total_sales: Number(totals.gross_sales || 0),
          net_revenue: Number(totals.net_revenue || 0),
          orders_count: Number(totals.orders_count || 0),
          items_sold: Number(totals.items_sold || 0),
          refunds: Number(totals.refunds || 0),
          taxes: Number(totals.taxes || 0),
          shipping: Number(totals.shipping || 0),
          discounts: Number(totals.discounts || 0),
        },
        intervals,
      };
    }
    // Fallback to v3 sales report
    const v3Url = `${this.baseV3Url}/reports/sales?${this.authQuery}&date_min=${encodeURIComponent(after)}&date_max=${encodeURIComponent(before)}`;
    res = await fetch(v3Url);
    if (!res.ok) throw new Error(`Failed to fetch revenue stats: ${res.statusText}`);
    const legacy = await res.json();
    const total_sales = Number(legacy?.total_sales || 0);
    const totals = { total_sales } as any;
    const intervals = Array.isArray(legacy?.sales)
      ? legacy.sales.map((p: any) => ({ date: p.date, total_sales: Number(p.total_sales || 0) }))
      : [];
    return { totals, intervals } as WCRevenueStats;
  }

  async getTopProducts(params: { range?: 'last_7_days'|'last_30_days'|'mtd'|'qtd'|'ytd'|'custom'; after?: string; before?: string; limit?: number }): Promise<WCTopProductItem[]> {
    const { after, before } = this.resolveRange(params.range, params.after, params.before);
    const url = `${this.baseAnalyticsUrl}/reports/products/stats?${this.authQuery}&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&per_page=${params.limit || 10}&order_by=net_revenue&order=desc`;
    let res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const items: WCTopProductItem[] = (data?.data || data?.rows || data?.items || data?.intervals || []).map((row: any) => ({
        product_id: Number(row.product_id || row.extended_info?.product_id || row.id || 0),
        name: row.extended_info?.name || row.name,
        quantity: Number(row?.subtotals?.items_sold || row.quantity || 0),
        total: Number(row?.subtotals?.net_revenue || row.total || 0),
      }));
      return items;
    }
    // Fallback to v3 top sellers
    const v3Url = `${this.baseV3Url}/reports/top_sellers?${this.authQuery}&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&per_page=${params.limit || 10}`;
    res = await fetch(v3Url);
    if (!res.ok) throw new Error(`Failed to fetch top products: ${res.statusText}`);
    const legacy = await res.json();
    return (Array.isArray(legacy) ? legacy : []).map((p: any) => ({
      product_id: Number(p.product_id || p.product || 0),
      name: p.title || p.name,
      quantity: Number(p.quantity || 0),
      total: Number(p.total || 0),
    }));
  }

  async getOrdersStats(params: { range?: 'last_7_days'|'last_30_days'|'mtd'|'qtd'|'ytd'|'custom'; after?: string; before?: string; interval?: 'day'|'week'|'month' }): Promise<WCOrdersStats> {
    const { after, before } = this.resolveRange(params.range, params.after, params.before);
    const interval = params.interval || 'day';
    const url = `${this.baseAnalyticsUrl}/reports/orders/stats?${this.authQuery}&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&interval=${interval}`;
    let res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const totals = data?.totals || {};
      const intervals = (data?.intervals || []).map((p: any) => ({
        date: p.date,
        orders_count: Number(p.subtotals?.orders_count || 0),
        avg_order_value: Number(p.subtotals?.avg_order_value || 0),
        net_revenue: Number(p.subtotals?.net_revenue || 0),
        refunds: Number(p.subtotals?.refunds || 0),
      }));
      return {
        totals: {
          orders_count: Number(totals.orders_count || 0),
          avg_order_value: Number(totals.avg_order_value || 0),
          net_revenue: Number(totals.net_revenue || 0),
          refunds: Number(totals.refunds || 0),
        },
        intervals,
      };
    }
    // Fallback not available for orders stats in v3; return empty
    return { totals: {}, intervals: [] };
  }

  async getProductStats(params: { productIds?: number[]; range?: 'last_7_days'|'last_30_days'|'mtd'|'qtd'|'ytd'|'custom'; after?: string; before?: string; interval?: 'day'|'week'|'month' }): Promise<WCProductStatsPoint[]> {
    const { after, before } = this.resolveRange(params.range, params.after, params.before);
    const interval = params.interval || 'day';
    const ids = params.productIds && params.productIds.length ? `&products=${params.productIds.join(',')}` : '';
    const url = `${this.baseAnalyticsUrl}/reports/products/stats?${this.authQuery}&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&interval=${interval}${ids}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const out: WCProductStatsPoint[] = [];
    const intervals = data?.intervals || [];
    for (const bucket of intervals) {
      const date = bucket.date;
      const items = bucket?.subtotals?.products || bucket?.products || [];
      for (const item of items) {
        out.push({
          date,
          product_id: Number(item.product_id || item.id || 0),
          quantity: Number(item.items_sold || item.quantity || 0),
          net_revenue: Number(item.net_revenue || item.total || 0),
        });
      }
    }
    return out;
  }
}


