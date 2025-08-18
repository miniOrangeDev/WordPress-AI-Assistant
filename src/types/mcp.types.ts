import type { AuthParams } from '../config/schema.js';

export interface CreatePageParams extends AuthParams {
  title: string;
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  parent?: number;
  menuOrder?: number;
  template?: string;
  customFields?: Record<string, unknown>;
}

export interface GetPagesParams extends AuthParams {
  search?: string;
  status?: 'draft' | 'publish' | 'private' | 'any';
  page?: number;
  perPage?: number;
  parent?: number;
}

export interface GetPageParams extends AuthParams {
  pageId: number;
}

export interface UpdatePageParams extends AuthParams {
  pageId: number;
  title?: string;
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  parent?: number | null;
  menuOrder?: number;
  template?: string | null;
  customFields?: Record<string, unknown>;
}

export interface DeletePageParams extends AuthParams {
  pageId: number;
  force?: boolean; // default true
}

export interface CreatePostParams extends AuthParams {
  title: string;
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  categories?: number[]; // category IDs
  tags?: number[]; // tag IDs
  customFields?: Record<string, unknown>;
}

export interface GetPostsParams extends AuthParams {
  search?: string;
  status?: 'draft' | 'publish' | 'private' | 'any';
  page?: number;
  perPage?: number;
  categories?: number[];
  tags?: number[];
}

export interface GetPostParams extends AuthParams {
  postId: number;
}

export interface UpdatePostParams extends AuthParams {
  postId: number;
  title?: string;
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  categories?: number[] | null;
  tags?: number[] | null;
  customFields?: Record<string, unknown>;
}

export interface DeletePostParams extends AuthParams {
  postId: number;
  force?: boolean; // default true
}

export interface CustomFieldParams extends AuthParams {
  id: number;
  type: 'post' | 'page';
  key: string;
  value: unknown;
}

export interface GetCustomFieldsParams extends AuthParams {
  id: number;
  type: 'post' | 'page';
}

export interface DeleteCustomFieldParams extends AuthParams {
  id: number;
  type: 'post' | 'page';
  key: string;
}

export interface UploadMediaParams extends AuthParams {
  fileName: string;
  fileDataBase64: string; // base64-encoded binary
  mimeType: string;
  altText?: string;
  title?: string;
}

export interface AttachMediaParams extends AuthParams {
  mediaId: number;
  id: number; // post or page id
  type: 'post' | 'page';
}

export interface CategoryParams extends AuthParams {
  name: string;
  slug?: string;
  description?: string;
  parent?: number;
}

export interface TagParams extends AuthParams {
  name: string;
  slug?: string;
  description?: string;
}

export interface AssignTermsParams extends AuthParams {
  id: number; // post id
  categories?: number[];
  tags?: number[];
}

export interface CreateUserParams extends AuthParams {
  newUsername: string;
  email: string;
  newPassword: string;
  name?: string; // display name
  roles?: string[]; // role slugs
}

export interface UpdateUserParams extends AuthParams {
  userId: number;
  email?: string;
  newPassword?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  url?: string;
  description?: string;
  roles?: string[];
}

export interface DeleteUserParams extends AuthParams {
  userId: number;
  reassign?: number; // user ID to reassign content to
  force?: boolean; // default true
}

export interface GetUserParams extends AuthParams {
  userId: number;
}

export interface GetUsersParams extends AuthParams {
  search?: string;
  roles?: string[];
  page?: number;
  perPage?: number;
}

// WooCommerce Products
export interface CreateProductParams extends AuthParams {
  name: string;
  type?: string; // simple, variable, etc.
  status?: string; // draft, publish
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  categories?: number[]; // term IDs
  tags?: number[]; // term IDs
  images?: { src: string; name?: string; alt?: string }[];
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  // Auth
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}

export interface UpdateProductParams extends AuthParams {
  productId: number;
  name?: string;
  type?: string;
  status?: string;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  categories?: number[] | null;
  tags?: number[] | null;
  images?: { src: string; name?: string; alt?: string }[] | null;
  manage_stock?: boolean;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}

export interface DeleteProductParams extends AuthParams {
  productId: number;
  force?: boolean; // default true
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}

export interface GetProductParams extends AuthParams {
  productId: number;
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}

export interface GetProductsParams extends AuthParams {
  search?: string;
  status?: string;
  sku?: string;
  page?: number;
  perPage?: number;
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}


