import { WPError } from '../utils/error.utils.js';
import { AuthService } from './auth.service.js';
export class WordPressService {
    baseUrl;
    authHeader;
    constructor(config) {
        const apiVersion = 'v2';
        this.baseUrl = `${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/${apiVersion}`;
        this.authHeader = new AuthService().getAuthHeader({
            siteUrl: config.siteUrl,
            username: config.username,
            password: config.password,
        });
    }
    async createPage(params) {
        const body = {
            title: params.title,
            content: params.content ?? '',
            status: params.status ?? 'draft',
            meta: params.customFields ?? {},
        };
        if (typeof params.parent === 'number')
            body.parent = params.parent;
        if (typeof params.menuOrder === 'number')
            body.menu_order = params.menuOrder;
        if (typeof params.template === 'string')
            body.template = params.template;
        return await this.request('/pages', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async getPages(params) {
        const query = {};
        if (params.search)
            query.search = params.search;
        if (params.status && params.status !== 'any')
            query.status = params.status;
        if (typeof params.page === 'number')
            query.page = String(params.page);
        if (typeof params.perPage === 'number')
            query.per_page = String(params.perPage);
        if (typeof params.parent === 'number')
            query.parent = String(params.parent);
        return await this.request(`/pages${this.toQuery(query)}`, {
            method: 'GET',
        });
    }
    async getPage(params) {
        return await this.request(`/pages/${params.pageId}`, {
            method: 'GET',
        });
    }
    async createPost(params) {
        const body = {
            title: params.title,
            content: params.content ?? '',
            status: params.status ?? 'draft',
            meta: params.customFields ?? {},
        };
        if (Array.isArray(params.categories))
            body.categories = params.categories;
        if (Array.isArray(params.tags))
            body.tags = params.tags;
        return await this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async getPosts(params) {
        const query = {};
        if (params.search)
            query.search = params.search;
        if (params.status && params.status !== 'any')
            query.status = params.status;
        if (typeof params.page === 'number')
            query.page = String(params.page);
        if (typeof params.perPage === 'number')
            query.per_page = String(params.perPage);
        if (Array.isArray(params.categories) && params.categories.length)
            query.categories = params.categories.join(',');
        if (Array.isArray(params.tags) && params.tags.length)
            query.tags = params.tags.join(',');
        return await this.request(`/posts${this.toQuery(query)}`, {
            method: 'GET',
        });
    }
    async getPost(params) {
        return await this.request(`/posts/${params.postId}`, {
            method: 'GET',
        });
    }
    async updatePage(params) {
        const body = {};
        if (typeof params.title === 'string')
            body.title = params.title;
        if (typeof params.content === 'string')
            body.content = params.content;
        if (typeof params.status === 'string')
            body.status = params.status;
        if (typeof params.parent !== 'undefined')
            body.parent = params.parent;
        if (typeof params.menuOrder === 'number')
            body.menu_order = params.menuOrder;
        if (typeof params.template !== 'undefined')
            body.template = params.template;
        if (params.customFields)
            body.meta = params.customFields;
        return await this.request(`/pages/${params.pageId}`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async updatePost(params) {
        const body = {};
        if (typeof params.title === 'string')
            body.title = params.title;
        if (typeof params.content === 'string')
            body.content = params.content;
        if (typeof params.status === 'string')
            body.status = params.status;
        if (params.categories !== undefined)
            body.categories = params.categories;
        if (params.tags !== undefined)
            body.tags = params.tags;
        if (params.customFields)
            body.meta = params.customFields;
        return await this.request(`/posts/${params.postId}`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async deletePage(params) {
        const query = this.toQuery({ force: String(params.force ?? true) });
        await this.request(`/pages/${params.pageId}${query}`, { method: 'DELETE' });
    }
    async deletePost(params) {
        const query = this.toQuery({ force: String(params.force ?? true) });
        await this.request(`/posts/${params.postId}${query}`, { method: 'DELETE' });
    }
    async setCustomField(params) {
        const body = { meta: { [params.key]: params.value } };
        const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
        await this.request(path, { method: 'POST', body: JSON.stringify(body) });
    }
    async getCustomFields(params) {
        const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
        const entity = await this.request(path, { method: 'GET' });
        return entity?.meta ?? {};
    }
    async deleteCustomField(params) {
        const body = { meta: { [params.key]: null } };
        const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
        await this.request(path, { method: 'POST', body: JSON.stringify(body) });
    }
    async uploadMedia(params) {
        const binary = Buffer.from(params.fileDataBase64, 'base64');
        const response = await fetch(`${this.baseUrl}/media`, {
            method: 'POST',
            headers: {
                'Authorization': this.authHeader,
                'Content-Disposition': `attachment; filename="${params.fileName}"`,
                'Content-Type': params.mimeType,
            },
            body: binary,
        });
        const data = await response.json();
        if (!response.ok) {
            const message = data?.message || response.statusText || 'Unknown error';
            throw new WPError(String(response.status), message, response.status);
        }
        const media = data;
        if (params.altText || params.title) {
            const patchBody = {};
            if (params.altText)
                patchBody.alt_text = params.altText;
            if (params.title)
                patchBody.title = params.title;
            await this.request(`/media/${media.id}`, { method: 'POST', body: JSON.stringify(patchBody) });
        }
        return media;
    }
    async attachMedia(params) {
        const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
        await this.request(path, { method: 'POST', body: JSON.stringify({ featured_media: params.mediaId }) });
    }
    async createCategory(params) {
        const body = { name: params.name };
        if (params.slug)
            body.slug = params.slug;
        if (params.description)
            body.description = params.description;
        if (typeof params.parent === 'number')
            body.parent = params.parent;
        return await this.request('/categories', { method: 'POST', body: JSON.stringify(body) });
    }
    async createTag(params) {
        const body = { name: params.name };
        if (params.slug)
            body.slug = params.slug;
        if (params.description)
            body.description = params.description;
        return await this.request('/tags', { method: 'POST', body: JSON.stringify(body) });
    }
    async assignTerms(params) {
        const body = {};
        if (Array.isArray(params.categories))
            body.categories = params.categories;
        if (Array.isArray(params.tags))
            body.tags = params.tags;
        await this.request(`/posts/${params.id}`, { method: 'POST', body: JSON.stringify(body) });
    }
    // Users
    async createUser(params) {
        const body = {
            username: params.newUsername,
            email: params.email,
            password: params.newPassword,
        };
        if (params.name)
            body.name = params.name;
        if (Array.isArray(params.roles))
            body.roles = params.roles;
        return await this.request('/users', { method: 'POST', body: JSON.stringify(body) });
    }
    async updateUser(params) {
        const body = {};
        if (params.email)
            body.email = params.email;
        if (params.newPassword)
            body.password = params.newPassword;
        if (params.name)
            body.name = params.name;
        if (params.first_name)
            body.first_name = params.first_name;
        if (params.last_name)
            body.last_name = params.last_name;
        if (params.url)
            body.url = params.url;
        if (params.description)
            body.description = params.description;
        if (Array.isArray(params.roles))
            body.roles = params.roles;
        return await this.request(`/users/${params.userId}`, { method: 'POST', body: JSON.stringify(body) });
    }
    async deleteUser(params) {
        const query = {
            force: String(params.force ?? true),
        };
        if (typeof params.reassign === 'number')
            query.reassign = String(params.reassign);
        await this.request(`/users/${params.userId}${this.toQuery(query)}`, { method: 'DELETE' });
    }
    async getUser(params) {
        return await this.request(`/users/${params.userId}`, { method: 'GET' });
    }
    async getUsers(params) {
        const query = {};
        if (params.search)
            query.search = params.search;
        if (Array.isArray(params.roles) && params.roles.length)
            query.roles = params.roles.join(',');
        if (typeof params.page === 'number')
            query.page = String(params.page);
        if (typeof params.perPage === 'number')
            query.per_page = String(params.perPage);
        return await this.request(`/users${this.toQuery(query)}`, { method: 'GET' });
    }
    toQuery(query) {
        const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
        if (!entries.length)
            return '';
        const qs = new URLSearchParams(entries).toString();
        return `?${qs}`;
    }
    async request(path, init) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
                ...(init.headers || {}),
            },
        });
        const text = await response.text();
        let data = undefined;
        try {
            data = text ? JSON.parse(text) : undefined;
        }
        catch {
            // non-JSON
        }
        if (!response.ok) {
            const message = data?.message || response.statusText || 'Unknown error';
            throw new WPError(String(response.status), message, response.status);
        }
        return data;
    }
}
