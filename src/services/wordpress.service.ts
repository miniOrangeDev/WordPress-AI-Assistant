import type { AuthCredentials, WPConfig } from '../config/schema.js';
import type {
    CreatePageParams,
    CreatePostParams,
    CustomFieldParams,
    DeleteCustomFieldParams,
    DeletePageParams,
    DeletePostParams,
    GetCustomFieldsParams,
    GetPageParams,
    GetPagesParams,
    GetPostParams,
    GetPostsParams,
    UpdatePageParams,
    UpdatePostParams,
} from '../types/mcp.types.js';
import type { WPCategory, WPMedia, WPPage, WPPost, WPTag, WPUser } from '../types/wordpress.types.js';
import { WPError } from '../utils/error.utils.js';
import { AuthService } from './auth.service.js';

type JsonRecord = Record<string, unknown>;

export class WordPressService {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: WPConfig | AuthCredentials) {
    const apiVersion = 'v2';
    this.baseUrl = `${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/${apiVersion}`;
    this.authHeader = new AuthService().getAuthHeader({
      siteUrl: config.siteUrl,
      username: (config as AuthCredentials).username,
      password: (config as AuthCredentials).password,
    });
  }

  async createPage(params: Omit<CreatePageParams, 'siteUrl' | 'username' | 'password'>): Promise<WPPage> {
    const body: JsonRecord = {
      title: params.title,
      content: params.content ?? '',
      status: params.status ?? 'draft',
      meta: params.customFields ?? {},
    };
    if (typeof params.parent === 'number') body.parent = params.parent;
    if (typeof params.menuOrder === 'number') body.menu_order = params.menuOrder;
    if (typeof params.template === 'string') body.template = params.template;

    return await this.request<WPPage>('/pages', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPages(params: GetPagesParams): Promise<WPPage[]> {
    const query: Record<string, string> = {};
    if (params.search) query.search = params.search;
    if (params.status && params.status !== 'any') query.status = params.status;
    if (typeof params.page === 'number') query.page = String(params.page);
    if (typeof params.perPage === 'number') query.per_page = String(params.perPage);
    if (typeof params.parent === 'number') query.parent = String(params.parent);

    return await this.request<WPPage[]>(`/pages${this.toQuery(query)}`, {
      method: 'GET',
    });
  }

  async getPage(params: GetPageParams): Promise<WPPage> {
    return await this.request<WPPage>(`/pages/${params.pageId}`, {
      method: 'GET',
    });
  }

  async createPost(params: Omit<CreatePostParams, 'siteUrl' | 'username' | 'password'>): Promise<WPPost> {
    const body: JsonRecord = {
      title: params.title,
      content: params.content ?? '',
      status: params.status ?? 'draft',
      meta: params.customFields ?? {},
    };
    if (Array.isArray(params.categories)) body.categories = params.categories;
    if (Array.isArray(params.tags)) body.tags = params.tags;

    return await this.request<WPPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getPosts(params: GetPostsParams): Promise<WPPost[]> {
    const query: Record<string, string> = {};
    if (params.search) query.search = params.search;
    if (params.status && params.status !== 'any') query.status = params.status;
    if (typeof params.page === 'number') query.page = String(params.page);
    if (typeof params.perPage === 'number') query.per_page = String(params.perPage);
    if (Array.isArray(params.categories) && params.categories.length) query.categories = params.categories.join(',');
    if (Array.isArray(params.tags) && params.tags.length) query.tags = params.tags.join(',');

    return await this.request<WPPost[]>(`/posts${this.toQuery(query)}`, {
      method: 'GET',
    });
  }

  async getPost(params: GetPostParams): Promise<WPPost> {
    return await this.request<WPPost>(`/posts/${params.postId}`, {
      method: 'GET',
    });
  }

  async updatePage(params: UpdatePageParams): Promise<WPPage> {
    const body: JsonRecord = {};
    if (typeof params.title === 'string') body.title = params.title;
    if (typeof params.content === 'string') body.content = params.content;
    if (typeof params.status === 'string') body.status = params.status;
    if (typeof params.parent !== 'undefined') body.parent = params.parent;
    if (typeof params.menuOrder === 'number') body.menu_order = params.menuOrder;
    if (typeof params.template !== 'undefined') body.template = params.template;
    if (params.customFields) body.meta = params.customFields;
    return await this.request<WPPage>(`/pages/${params.pageId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updatePost(params: UpdatePostParams): Promise<WPPost> {
    const body: JsonRecord = {};
    if (typeof params.title === 'string') body.title = params.title;
    if (typeof params.content === 'string') body.content = params.content;
    if (typeof params.status === 'string') body.status = params.status;
    if (params.categories !== undefined) body.categories = params.categories as any;
    if (params.tags !== undefined) body.tags = params.tags as any;
    if (params.customFields) body.meta = params.customFields;
    return await this.request<WPPost>(`/posts/${params.postId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deletePage(params: DeletePageParams): Promise<void> {
    const query = this.toQuery({ force: String(params.force ?? true) });
    await this.request(`/pages/${params.pageId}${query}`, { method: 'DELETE' });
  }

  async deletePost(params: DeletePostParams): Promise<void> {
    const query = this.toQuery({ force: String(params.force ?? true) });
    await this.request(`/posts/${params.postId}${query}`, { method: 'DELETE' });
  }

  async setCustomField(params: CustomFieldParams): Promise<void> {
    const body: JsonRecord = { meta: { [params.key]: params.value } };
    const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
    await this.request(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async getCustomFields(params: GetCustomFieldsParams): Promise<Record<string, unknown>> {
    const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
    const entity = await this.request<WPPage | WPPost>(path, { method: 'GET' });
    return (entity as any)?.meta ?? {};
  }

  async deleteCustomField(params: DeleteCustomFieldParams): Promise<void> {
    const body: JsonRecord = { meta: { [params.key]: null } };
    const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
    await this.request(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async uploadMedia(params: { fileName: string; fileDataBase64: string; mimeType: string; altText?: string; title?: string }): Promise<WPMedia> {
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
      const message = (data as any)?.message || response.statusText || 'Unknown error';
      throw new WPError(String(response.status), message, response.status);
    }
    const media: WPMedia = data as WPMedia;
    if (params.altText || params.title) {
      const patchBody: JsonRecord = {};
      if (params.altText) (patchBody as any).alt_text = params.altText;
      if (params.title) (patchBody as any).title = params.title;
      await this.request(`/media/${media.id}`, { method: 'POST', body: JSON.stringify(patchBody) });
    }
    return media;
  }

  async attachMedia(params: { mediaId: number; id: number; type: 'post' | 'page' }): Promise<void> {
    const path = params.type === 'page' ? `/pages/${params.id}` : `/posts/${params.id}`;
    await this.request(path, { method: 'POST', body: JSON.stringify({ featured_media: params.mediaId }) });
  }

  async createCategory(params: { name: string; slug?: string; description?: string; parent?: number }): Promise<WPCategory> {
    const body: JsonRecord = { name: params.name };
    if (params.slug) (body as any).slug = params.slug;
    if (params.description) (body as any).description = params.description;
    if (typeof params.parent === 'number') (body as any).parent = params.parent;
    return await this.request<WPCategory>('/categories', { method: 'POST', body: JSON.stringify(body) });
  }

  async createTag(params: { name: string; slug?: string; description?: string }): Promise<WPTag> {
    const body: JsonRecord = { name: params.name };
    if (params.slug) (body as any).slug = params.slug;
    if (params.description) (body as any).description = params.description;
    return await this.request<WPTag>('/tags', { method: 'POST', body: JSON.stringify(body) });
  }

  async assignTerms(params: { id: number; categories?: number[]; tags?: number[] }): Promise<void> {
    const body: JsonRecord = {};
    if (Array.isArray(params.categories)) (body as any).categories = params.categories;
    if (Array.isArray(params.tags)) (body as any).tags = params.tags;
    await this.request(`/posts/${params.id}`, { method: 'POST', body: JSON.stringify(body) });
  }

  // Users
  async createUser(params: { newUsername: string; email: string; newPassword: string; name?: string; roles?: string[] }): Promise<WPUser> {
    const body: JsonRecord = {
      username: params.newUsername,
      email: params.email,
      password: params.newPassword,
    };
    if (params.name) (body as any).name = params.name;
    if (Array.isArray(params.roles)) (body as any).roles = params.roles;
    return await this.request<WPUser>('/users', { method: 'POST', body: JSON.stringify(body) });
  }

  async updateUser(params: { userId: number; email?: string; newPassword?: string; name?: string; first_name?: string; last_name?: string; url?: string; description?: string; roles?: string[] }): Promise<WPUser> {
    const body: JsonRecord = {};
    if (params.email) (body as any).email = params.email;
    if (params.newPassword) (body as any).password = params.newPassword;
    if (params.name) (body as any).name = params.name;
    if (params.first_name) (body as any).first_name = params.first_name;
    if (params.last_name) (body as any).last_name = params.last_name;
    if (params.url) (body as any).url = params.url;
    if (params.description) (body as any).description = params.description;
    if (Array.isArray(params.roles)) (body as any).roles = params.roles;
    return await this.request<WPUser>(`/users/${params.userId}`, { method: 'POST', body: JSON.stringify(body) });
  }

  async deleteUser(params: { userId: number; reassign?: number; force?: boolean }): Promise<void> {
    const query: Record<string, string> = {
      force: String(params.force ?? true),
    };
    if (typeof params.reassign === 'number') query.reassign = String(params.reassign);
    await this.request(`/users/${params.userId}${this.toQuery(query)}`, { method: 'DELETE' });
  }

  async getUser(params: { userId: number }): Promise<WPUser> {
    return await this.request<WPUser>(`/users/${params.userId}`, { method: 'GET' });
  }

  async getUsers(params: { search?: string; roles?: string[]; page?: number; perPage?: number }): Promise<WPUser[]> {
    const query: Record<string, string> = {};
    if (params.search) query.search = params.search;
    if (Array.isArray(params.roles) && params.roles.length) query.roles = params.roles.join(',');
    if (typeof params.page === 'number') query.page = String(params.page);
    if (typeof params.perPage === 'number') query.per_page = String(params.perPage);
    return await this.request<WPUser[]>(`/users${this.toQuery(query)}`, { method: 'GET' });
  }

  private toQuery(query: Record<string, string>): string {
    const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
    if (!entries.length) return '';
    const qs = new URLSearchParams(entries as [string, string][]).toString();
    return `?${qs}`;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

    const text = await response.text();
    let data: unknown = undefined;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      // non-JSON
    }

    if (!response.ok) {
      const message = (data as any)?.message || response.statusText || 'Unknown error';
      throw new WPError(String(response.status), message, response.status);
    }

    return data as T;
  }
}


