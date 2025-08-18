## WordPress AI Assistant

Model Context Protocol (MCP) server to let AI assistants safely create, read, update, and delete WordPress content and WooCommerce products via the official REST APIs.

### Features
- WordPress Pages and Posts: create/read/update/delete, list
- Custom fields (meta): set/get/delete
- Media: upload and attach to posts/pages
- Taxonomies: create category/tag and assign to posts
- Users: create/update/delete, list/get
- WooCommerce Products: create/read/update/delete, list

### Requirements
- Node.js 18.17+ and npm
- WordPress 5.6+ reachable at `https://your-site.com/wp-json/`
- Authentication
  - WordPress: Application Passwords or Basic Auth plugin
  - WooCommerce: REST API keys (consumer key/secret) with read/write

### 1) Clone and install
```bash
git clone https://github.com/miniOrangeDev/WordPress-AI-Assistant.git
cd WordPress-AI-Assistant
npm install
```

### 2) Configure environment
Create `.env` in project root with your credentials:
```env
# WordPress
WP_SITE_URL=https://your-wordpress-site.com
WP_USERNAME=your-username
WP_PASSWORD=your-application-password-or-password
WP_API_VERSION=v2

# WooCommerce
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Notes
- You can also provide credentials per-call via tool params if you prefer not to use env.
- Application Passwords are recommended for WordPress.

### 3) Build
```bash
npm run build
```

### 4) Use with an MCP client
Configure your MCP-enabled client (e.g., Claude Desktop) to launch this server. Example config:
```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "WP_SITE_URL": "https://your-wordpress-site.com",
        "WP_USERNAME": "your-username",
        "WP_PASSWORD": "your-app-password",
        "WC_CONSUMER_KEY": "ck_xxx",
        "WC_CONSUMER_SECRET": "cs_xxx"
      }
    }
  }
}
```
Restart the client. It should detect a server called `wordpress-mcp` with tools below.

### 5) Quick test flows
- Pages
  - create_page: title="MCP Test Page", status="draft"
  - get_page: pageId from previous response
  - update_page: pageId, title/content
  - delete_page: pageId, force true/false

- Posts
  - create_post: title, content, status
  - get_post / get_posts
  - update_post / delete_post

- Custom fields
  - set_custom_field: type="page"|"post", id, key, value
  - get_custom_fields / delete_custom_field

- Media
  - upload_media: fileName, mimeType, fileDataBase64
  - attach_media: mediaId, id, type="page"|"post"

- Taxonomies
  - create_category / create_tag
  - assign_terms: id (post), categories? [], tags? []

- Users
  - create_user: newUsername, email, newPassword, name?, roles?
  - update_user: userId, email?, newPassword?, name?, first_name?, last_name?, url?, description?, roles?
  - delete_user: userId, reassign?, force?
  - get_user / get_users

- WooCommerce Products
  - create_product: name, type?, status?, sku?, regular_price?, sale_price?, description?, images?, stock fields, categories?/tags? (IDs)
  - update_product: productId plus any fields (null arrays clear terms)
  - delete_product: productId, force?
  - get_product / get_products: search?, status?, sku?, pagination

Tip (Windows, PowerShell) to base64 an image for upload:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\image.jpg'))
```

### 6) Troubleshooting
- 401 Authentication failed: verify credentials or Application Password
- 403/404: ensure IDs exist and your user has required capabilities
- Media upload: use raw base64 (no data URI prefix), correct mime type
- WooCommerce: ensure keys are Read/Write and REST v3 is enabled

### Scripts
- build: `npm run build` — compile TypeScript to `dist/`
- start: `npm start` — run compiled server (requires an MCP client over stdio)
- typecheck: `npm run typecheck` — run TS without emitting

### Project layout
- `src/index.ts`: entry
- `src/server.ts`: MCP server and tool registration
- `src/services/*`: API clients (WordPress, WooCommerce, auth)
- `src/types/*`: shared type definitions
- `src/utils/*`: helpers (errors, validation, NLP)

### Security
- Do not commit `.env`
- Prefer Application Passwords over plain passwords
- Avoid logging secrets; rotate keys regularly


