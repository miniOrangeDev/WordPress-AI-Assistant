import type { WCAuthCredentials } from '../config/schema.js';
import type { WCProduct } from '../types/woocommerce.types.js';

export class WooCommerceService {
  private baseUrl: string;
  private authQuery: string;

  constructor(credentials: WCAuthCredentials) {
    this.baseUrl = `${credentials.siteUrl.replace(/\/$/, '')}/wp-json/wc/v3`;
    const key = encodeURIComponent(credentials.consumerKey);
    const secret = encodeURIComponent(credentials.consumerSecret);
    this.authQuery = `consumer_key=${key}&consumer_secret=${secret}`;
  }

  async createProduct(body: Partial<WCProduct>): Promise<WCProduct> {
    return await this.request<WCProduct>('/products', { method: 'POST', body: JSON.stringify(body) });
  }

  async getProduct(productId: number): Promise<WCProduct> {
    return await this.request<WCProduct>(`/products/${productId}`, { method: 'GET' });
  }

  async getProducts(query: Record<string, string>): Promise<WCProduct[]> {
    const qs = this.toQuery(query);
    return await this.request<WCProduct[]>(`/products${qs}`, { method: 'GET' });
  }

  async updateProduct(productId: number, body: Partial<WCProduct>): Promise<WCProduct> {
    return await this.request<WCProduct>(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  async deleteProduct(productId: number, force: boolean = true): Promise<void> {
    await this.request(`/products/${productId}${this.toQuery({ force: String(force) })}`, { method: 'DELETE' });
  }

  private toQuery(query: Record<string, string>): string {
    const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
    const qs = entries.length ? `&${new URLSearchParams(entries as [string, string][]).toString()}` : '';
    return `?${this.authQuery}${qs}`;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}${path.includes('?') ? '' : `?${this.authQuery}`}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      const message = (data as any)?.message || response.statusText || 'Unknown error';
      throw new Error(`WooCommerce API error: ${message}`);
    }
    return data as T;
  }
}


