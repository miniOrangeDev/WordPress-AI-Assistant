# WordPress MCP Server Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AI Assistant (Claude, etc.)           │
│                  "Create a blog post about..."           │
└────────────────────┬────────────────────────────────────┘
                     │ Natural Language
                     ▼
┌─────────────────────────────────────────────────────────┐
│                WordPress MCP Server                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │            MCP Protocol Handler                  │   │
│  │         (JSON-RPC 2.0 over stdio)               │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │          Request Router & Validator              │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │              Method Handlers                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │  Posts   │ │  Pages   │ │  Media   │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │Categories│ │   Tags   │ │  Custom  │       │   │
│  │  └──────────┘ └──────────┘ │  Fields  │       │   │
│  │                             └──────────┘       │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │           WordPress API Client                   │   │
│  │         (REST API + Basic Auth)                 │   │
│  └─────────────────┬───────────────────────────────┘   │
└────────────────────┼─────────────────────────────────┘
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              WordPress Site (5.6+)                       │
│         Classic Editor + Basic Auth Plugin               │
└─────────────────────────────────────────────────────────┘
```

## 2. Project Structure

```
wordpress-mcp-server/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server setup
│   ├── config/
│   │   ├── constants.ts         # API endpoints, defaults
│   │   └── schema.ts            # Type definitions
│   ├── handlers/
│   │   ├── posts.handler.ts     # Post operations
│   │   ├── pages.handler.ts     # Page operations (priority)
│   │   ├── media.handler.ts     # Media uploads
│   │   ├── taxonomies.handler.ts # Categories & tags
│   │   └── custom-fields.handler.ts # Meta fields
│   ├── services/
│   │   ├── wordpress.service.ts # WP API client
│   │   ├── auth.service.ts      # Authentication
│   │   └── content.service.ts   # Content processing
│   ├── utils/
│   │   ├── nlp.utils.ts         # Natural language helpers
│   │   ├── validator.utils.ts   # Input validation
│   │   └── formatter.utils.ts   # Content formatting
│   └── types/
│       ├── wordpress.types.ts   # WP data structures
│       └── mcp.types.ts         # MCP protocol types
├── tests/
├── docs/
│   ├── API.md
│   └── EXAMPLES.md
├── package.json
├── tsconfig.json
└── README.md
```

## 3. Core Components

### 3.1 MCP Server Core
```typescript
// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class WordPressMCPServer {
  private server: Server;
  private wpService: WordPressService;
  
  constructor() {
    this.server = new Server({
      name: 'wordpress-mcp',
      version: '1.0.0'
    });
  }
  
  async initialize() {
    // Register all method handlers
    this.registerHandlers();
    
    // Setup transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
  
  private registerHandlers() {
    // Page operations (priority)
    this.server.setRequestHandler('create_page', this.handleCreatePage);
    this.server.setRequestHandler('update_page', this.handleUpdatePage);
    this.server.setRequestHandler('get_pages', this.handleGetPages);
    
    // Post operations
    this.server.setRequestHandler('create_post', this.handleCreatePost);
    this.server.setRequestHandler('update_post', this.handleUpdatePost);
    
    // Custom fields
    this.server.setRequestHandler('set_custom_field', this.handleSetCustomField);
  }
}
```

### 3.2 WordPress Service Layer
```typescript
// src/services/wordpress.service.ts
export class WordPressService {
  private baseUrl: string;
  private auth: BasicAuth;
  
  constructor(config: WPConfig) {
    this.baseUrl = `${config.siteUrl}/wp-json/wp/v2`;
    this.auth = {
      username: config.username,
      password: config.password
    };
  }
  
  async createPage(data: PageData): Promise<WPPage> {
    const response = await fetch(`${this.baseUrl}/pages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title: data.title,
        content: data.content,
        status: data.status || 'draft',
        meta: data.customFields || {}
      })
    });
    return response.json();
  }
  
  private getHeaders(): Headers {
    return {
      'Authorization': 'Basic ' + btoa(`${this.auth.username}:${this.auth.password}`),
      'Content-Type': 'application/json'
    };
  }
}
```

### 3.3 Natural Language Processing
```typescript
// src/utils/nlp.utils.ts
export class NLPUtils {
  // Parse natural language into structured data
  static parseContentRequest(input: string): ContentRequest {
    return {
      title: this.extractTitle(input),
      content: this.extractContent(input),
      type: this.detectContentType(input),
      status: this.detectPublishStatus(input),
      categories: this.extractCategories(input),
      tags: this.extractTags(input),
      customFields: this.extractCustomFields(input)
    };
  }
  
  static detectContentType(input: string): 'post' | 'page' {
    const pageIndicators = ['page', 'landing', 'about', 'contact', 'services'];
    const lowercaseInput = input.toLowerCase();
    return pageIndicators.some(indicator => 
      lowercaseInput.includes(indicator)
    ) ? 'page' : 'post';
  }
  
  static detectPublishStatus(input: string): string {
    if (input.match(/\b(publish|live|public)\b/i)) return 'publish';
    if (input.match(/\b(private|hidden)\b/i)) return 'private';
    return 'draft';
  }
}
```

## 4. Method Definitions

### 4.1 Primary Methods (Pages Focus)

```typescript
interface Methods {
  // Pages (Priority)
  'create_page': (params: CreatePageParams) => Promise<WPPage>;
  'update_page': (params: UpdatePageParams) => Promise<WPPage>;
  'delete_page': (params: { pageId: number }) => Promise<void>;
  'get_pages': (params: GetPagesParams) => Promise<WPPage[]>;
  'get_page': (params: { pageId: number }) => Promise<WPPage>;
  
  // Posts
  'create_post': (params: CreatePostParams) => Promise<WPPost>;
  'update_post': (params: UpdatePostParams) => Promise<WPPost>;
  'delete_post': (params: { postId: number }) => Promise<void>;
  'get_posts': (params: GetPostsParams) => Promise<WPPost[]>;
  
  // Custom Fields
  'set_custom_field': (params: CustomFieldParams) => Promise<void>;
  'get_custom_fields': (params: { id: number, type: string }) => Promise<object>;
  'delete_custom_field': (params: { id: number, key: string }) => Promise<void>;
  
  // Media
  'upload_media': (params: UploadMediaParams) => Promise<WPMedia>;
  'attach_media': (params: AttachMediaParams) => Promise<void>;
  
  // Taxonomies
  'create_category': (params: CategoryParams) => Promise<WPCategory>;
  'create_tag': (params: TagParams) => Promise<WPTag>;
  'assign_terms': (params: AssignTermsParams) => Promise<void>;
}
```

### 4.2 Parameter Structures

```typescript
interface CreatePageParams {
  // Required
  title: string;
  
  // Optional
  content?: string;
  status?: 'draft' | 'publish' | 'private';
  parent?: number;
  menuOrder?: number;
  template?: string;
  customFields?: Record<string, any>;
  
  // Authentication (optional if in env)
  siteUrl?: string;
  username?: string;
  password?: string;
}

interface CustomFieldParams {
  id: number;
  type: 'post' | 'page';
  key: string;
  value: any;
  
  // Authentication
  siteUrl?: string;
  username?: string;
  password?: string;
}
```

## 5. Authentication Flow

```typescript
// src/services/auth.service.ts
export class AuthService {
  private credentials: Map<string, AuthCredentials> = new Map();
  
  async authenticate(params: AuthParams): Promise<AuthCredentials> {
    // Check if credentials are provided in params
    if (params.username && params.password) {
      return {
        username: params.username,
        password: params.password,
        siteUrl: params.siteUrl
      };
    }
    
    // Fall back to environment variables
    return {
      username: process.env.WP_USERNAME,
      password: process.env.WP_PASSWORD,
      siteUrl: process.env.WP_SITE_URL
    };
  }
  
  getAuthHeader(credentials: AuthCredentials): string {
    const token = Buffer.from(
      `${credentials.username}:${credentials.password}`
    ).toString('base64');
    return `Basic ${token}`;
  }
}
```

## 6. Configuration

### 6.1 Environment Variables
```env
# .env.example
WP_SITE_URL=https://your-wordpress-site.com
WP_USERNAME=your-username
WP_PASSWORD=your-password
WP_API_VERSION=v2
```

### 6.2 MCP Configuration
```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["path/to/wordpress-mcp-server/dist/index.js"],
      "env": {
        "WP_SITE_URL": "https://your-site.com",
        "WP_USERNAME": "admin",
        "WP_PASSWORD": "password"
      }
    }
  }
}
```

## 7. Error Handling

```typescript
// src/utils/error.utils.ts
export class WPError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode?: number
  ) {
    super(message);
  }
}

export class ErrorHandler {
  static handle(error: any): WPError {
    if (error.response?.status === 401) {
      return new WPError('AUTH_FAILED', 'Authentication failed', 401);
    }
    if (error.response?.status === 404) {
      return new WPError('NOT_FOUND', 'Resource not found', 404);
    }
    return new WPError('UNKNOWN', error.message || 'Unknown error');
  }
}
```

## 8. Usage Examples

### Natural Language → MCP → WordPress

**User says:** "Create a new page about our services"

**MCP translates to:**
```json
{
  "method": "create_page",
  "params": {
    "title": "Our Services",
    "status": "draft"
  }
}
```

**User says:** "Publish a blog post about WordPress tips with custom field 'author_bio' set to 'John Doe'"

**MCP translates to:**
```json
{
  "method": "create_post",
  "params": {
    "title": "WordPress Tips",
    "status": "publish",
    "customFields": {
      "author_bio": "John Doe"
    }
  }
}
```