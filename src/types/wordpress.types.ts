interface WPRenderedField {
  rendered: string;
  protected?: boolean;
}

interface WPBaseEntity {
  id: number;
  date?: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  link?: string;
  status?: string;
}

export interface WPPage extends WPBaseEntity {
  type?: 'page';
  title?: WPRenderedField;
  content?: WPRenderedField;
  excerpt?: WPRenderedField;
  parent?: number;
  menu_order?: number;
  template?: string;
  meta?: Record<string, unknown>;
}

export interface WPPost extends WPBaseEntity {
  type?: 'post';
  title?: WPRenderedField;
  content?: WPRenderedField;
  excerpt?: WPRenderedField;
  categories?: number[];
  tags?: number[];
  meta?: Record<string, unknown>;
}

export interface WPMedia extends WPBaseEntity {
  type?: 'attachment';
  media_type?: string;
  mime_type?: string;
  source_url?: string;
  alt_text?: string;
  title?: WPRenderedField;
}

export interface WPCategory {
  id: number;
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
}

export interface WPTag {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

export interface WPUser extends WPBaseEntity {
  name?: string; // display name
  slug?: string; // user_nicename
  link?: string;
  url?: string;
  description?: string;
  first_name?: string;
  last_name?: string;
  roles?: string[];
}


