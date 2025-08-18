export class WooCommerceService {
    baseUrl;
    authQuery;
    constructor(credentials) {
        this.baseUrl = `${credentials.siteUrl.replace(/\/$/, '')}/wp-json/wc/v3`;
        const key = encodeURIComponent(credentials.consumerKey);
        const secret = encodeURIComponent(credentials.consumerSecret);
        this.authQuery = `consumer_key=${key}&consumer_secret=${secret}`;
    }
    async createProduct(body) {
        return await this.request('/products', { method: 'POST', body: JSON.stringify(body) });
    }
    async getProduct(productId) {
        return await this.request(`/products/${productId}`, { method: 'GET' });
    }
    async getProducts(query) {
        const qs = this.toQuery(query);
        return await this.request(`/products${qs}`, { method: 'GET' });
    }
    async updateProduct(productId, body) {
        return await this.request(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(body) });
    }
    async deleteProduct(productId, force = true) {
        await this.request(`/products/${productId}${this.toQuery({ force: String(force) })}`, { method: 'DELETE' });
    }
    toQuery(query) {
        const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
        const qs = entries.length ? `&${new URLSearchParams(entries).toString()}` : '';
        return `?${this.authQuery}${qs}`;
    }
    async request(path, init) {
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
            const message = data?.message || response.statusText || 'Unknown error';
            throw new Error(`WooCommerce API error: ${message}`);
        }
        return data;
    }
}
