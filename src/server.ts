import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AuthService } from './services/auth.service.js';
import { WordPressService } from './services/wordpress.service.js';
import type {
    AssignTermsParams,
    AttachMediaParams,
    CategoryParams,
    CreatePageParams,
    CreatePostParams,
    CreateUserParams,
    CustomFieldParams,
    DeleteCustomFieldParams,
    DeletePageParams,
    DeletePostParams,
    DeleteUserParams,
    GetCustomFieldsParams,
    GetPageParams,
    GetPagesParams,
    GetPostParams,
    GetPostsParams,
    GetUserParams,
    GetUsersParams,
    TagParams,
    UpdatePageParams,
    UpdatePostParams,
    UpdateUserParams,
    UploadMediaParams,
} from './types/mcp.types.js';
import type { WPCategory, WPMedia, WPPage, WPPost, WPTag, WPUser } from './types/wordpress.types.js';
import { ErrorHandler } from './utils/error.utils.js';
import { Validator } from './utils/validator.utils.js';

export class WordPressMCPServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: 'wordpress-mcp',
      version: '0.1.0',
    });
  }

  async initialize(): Promise<void> {
    this.registerHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  private registerHandlers(): void {
    // create_page
    this.server.tool(
      'create_page',
      {
        title: z.string().min(1),
        content: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private']).optional(),
        parent: z.number().optional(),
        menuOrder: z.number().optional(),
        template: z.string().optional(),
        customFields: z.record(z.any()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        const params = args as CreatePageParams;
        try {
          Validator.requireTitle(params.title);
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const page: WPPage = await wpService.createPage({
            title: params.title,
            content: params.content,
            status: params.status,
            parent: params.parent,
            menuOrder: params.menuOrder,
            template: params.template,
            customFields: params.customFields,
          });
          return {
            content: [
              { type: 'text', text: JSON.stringify(page) },
            ],
          } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // WooCommerce: create_product
    this.server.tool(
      'create_product',
      {
        name: z.string().min(1),
        type: z.string().optional(),
        status: z.string().optional(),
        sku: z.string().optional(),
        regular_price: z.string().optional(),
        sale_price: z.string().optional(),
        description: z.string().optional(),
        short_description: z.string().optional(),
        categories: z.array(z.number()).optional(),
        tags: z.array(z.number()).optional(),
        images: z.array(z.object({ src: z.string().url(), name: z.string().optional(), alt: z.string().optional() })).optional(),
        manage_stock: z.boolean().optional(),
        stock_quantity: z.number().optional(),
        stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
        siteUrl: z.string().url().optional(),
        wcConsumerKey: z.string().optional(),
        wcConsumerSecret: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as any as import('./types/mcp.types.js').CreateProductParams;
          const credentials = await new AuthService().authenticateWooCommerce(params);
          const { WooCommerceService } = await import('./services/woocommerce.service.js');
          const wc = new WooCommerceService(credentials);
          const body: any = {
            name: params.name,
            type: params.type,
            status: params.status,
            sku: params.sku,
            regular_price: params.regular_price,
            sale_price: params.sale_price,
            description: params.description,
            short_description: params.short_description,
            manage_stock: params.manage_stock,
            stock_quantity: params.stock_quantity,
            stock_status: params.stock_status,
          };
          if (Array.isArray(params.categories)) body.categories = params.categories.map((id) => ({ id }));
          if (Array.isArray(params.tags)) body.tags = params.tags.map((id) => ({ id }));
          if (Array.isArray(params.images)) body.images = params.images;
          const product = await wc.createProduct(body);
          return { content: [{ type: 'text', text: JSON.stringify(product) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // WooCommerce: update_product
    this.server.tool(
      'update_product',
      {
        productId: z.number(),
        name: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        sku: z.string().optional(),
        regular_price: z.string().optional(),
        sale_price: z.string().optional(),
        description: z.string().optional(),
        short_description: z.string().optional(),
        categories: z.array(z.number()).nullable().optional(),
        tags: z.array(z.number()).nullable().optional(),
        images: z.array(z.object({ src: z.string().url(), name: z.string().optional(), alt: z.string().optional() })).nullable().optional(),
        manage_stock: z.boolean().optional(),
        stock_quantity: z.number().optional(),
        stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
        siteUrl: z.string().url().optional(),
        wcConsumerKey: z.string().optional(),
        wcConsumerSecret: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as any as import('./types/mcp.types.js').UpdateProductParams;
          const credentials = await new AuthService().authenticateWooCommerce(params);
          const { WooCommerceService } = await import('./services/woocommerce.service.js');
          const wc = new WooCommerceService(credentials);
          const body: any = {};
          if (params.name !== undefined) body.name = params.name;
          if (params.type !== undefined) body.type = params.type;
          if (params.status !== undefined) body.status = params.status;
          if (params.sku !== undefined) body.sku = params.sku;
          if (params.regular_price !== undefined) body.regular_price = params.regular_price;
          if (params.sale_price !== undefined) body.sale_price = params.sale_price;
          if (params.description !== undefined) body.description = params.description;
          if (params.short_description !== undefined) body.short_description = params.short_description;
          if (params.manage_stock !== undefined) body.manage_stock = params.manage_stock;
          if (params.stock_quantity !== undefined) body.stock_quantity = params.stock_quantity;
          if (params.stock_status !== undefined) body.stock_status = params.stock_status;
          if (params.categories !== undefined) body.categories = params.categories === null ? [] : params.categories.map((id) => ({ id }));
          if (params.tags !== undefined) body.tags = params.tags === null ? [] : params.tags.map((id) => ({ id }));
          if (params.images !== undefined) body.images = params.images;
          const product = await wc.updateProduct(params.productId, body);
          return { content: [{ type: 'text', text: JSON.stringify(product) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // WooCommerce: delete_product
    this.server.tool(
      'delete_product',
      {
        productId: z.number(),
        force: z.boolean().optional(),
        siteUrl: z.string().url().optional(),
        wcConsumerKey: z.string().optional(),
        wcConsumerSecret: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as any as import('./types/mcp.types.js').DeleteProductParams;
          const credentials = await new AuthService().authenticateWooCommerce(params);
          const { WooCommerceService } = await import('./services/woocommerce.service.js');
          const wc = new WooCommerceService(credentials);
          await wc.deleteProduct(params.productId, params.force);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // WooCommerce: get_product
    this.server.tool(
      'get_product',
      {
        productId: z.number(),
        siteUrl: z.string().url().optional(),
        wcConsumerKey: z.string().optional(),
        wcConsumerSecret: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as any as import('./types/mcp.types.js').GetProductParams;
          const credentials = await new AuthService().authenticateWooCommerce(params);
          const { WooCommerceService } = await import('./services/woocommerce.service.js');
          const wc = new WooCommerceService(credentials);
          const product = await wc.getProduct(params.productId);
          return { content: [{ type: 'text', text: JSON.stringify(product) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // WooCommerce: get_products
    this.server.tool(
      'get_products',
      {
        search: z.string().optional(),
        status: z.string().optional(),
        sku: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        siteUrl: z.string().url().optional(),
        wcConsumerKey: z.string().optional(),
        wcConsumerSecret: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as any as import('./types/mcp.types.js').GetProductsParams;
          const credentials = await new AuthService().authenticateWooCommerce(params);
          const { WooCommerceService } = await import('./services/woocommerce.service.js');
          const wc = new WooCommerceService(credentials);
          const query: Record<string, string> = {};
          if (params.search) query.search = params.search;
          if (params.status) query.status = params.status;
          if (params.sku) query.sku = params.sku;
          if (typeof params.page === 'number') query.page = String(params.page);
          if (typeof params.perPage === 'number') query.per_page = String(params.perPage);
          const products = await wc.getProducts(query);
          return { content: [{ type: 'text', text: JSON.stringify(products) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );
    // get_pages
    this.server.tool(
      'get_pages',
      {
        search: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private', 'any']).optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        parent: z.number().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        const params = args as GetPagesParams;
        try {
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const pages: WPPage[] = await wpService.getPages(params);
          return { content: [{ type: 'text', text: JSON.stringify(pages) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_page
    this.server.tool(
      'get_page',
      {
        pageId: z.number(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as GetPageParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const page = await wpService.getPage(params);
          return { content: [{ type: 'text', text: JSON.stringify(page) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // create_post
    this.server.tool(
      'create_post',
      {
        title: z.string().min(1),
        content: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private']).optional(),
        categories: z.array(z.number()).optional(),
        tags: z.array(z.number()).optional(),
        customFields: z.record(z.any()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        const params = args as CreatePostParams;
        try {
          Validator.requireTitle(params.title);
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const post: WPPost = await wpService.createPost({
            title: params.title,
            content: params.content,
            status: params.status,
            categories: params.categories,
            tags: params.tags,
            customFields: params.customFields,
          });
          return { content: [{ type: 'text', text: JSON.stringify(post) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_posts
    this.server.tool(
      'get_posts',
      {
        search: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private', 'any']).optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        categories: z.array(z.number()).optional(),
        tags: z.array(z.number()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        const params = args as GetPostsParams;
        try {
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const posts: WPPost[] = await wpService.getPosts(params);
          return { content: [{ type: 'text', text: JSON.stringify(posts) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_post
    this.server.tool(
      'get_post',
      {
        postId: z.number(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as GetPostParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const post = await wpService.getPost(params);
          return { content: [{ type: 'text', text: JSON.stringify(post) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // update_page
    this.server.tool(
      'update_page',
      {
        pageId: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private']).optional(),
        parent: z.number().nullable().optional(),
        menuOrder: z.number().optional(),
        template: z.string().nullable().optional(),
        customFields: z.record(z.any()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as UpdatePageParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const page = await wpService.updatePage(params);
          return { content: [{ type: 'text', text: JSON.stringify(page) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // update_post
    this.server.tool(
      'update_post',
      {
        postId: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(['draft', 'publish', 'private']).optional(),
        categories: z.array(z.number()).nullable().optional(),
        tags: z.array(z.number()).nullable().optional(),
        customFields: z.record(z.any()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as UpdatePostParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const post = await wpService.updatePost(params);
          return { content: [{ type: 'text', text: JSON.stringify(post) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // delete_page
    this.server.tool(
      'delete_page',
      {
        pageId: z.number(),
        force: z.boolean().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as DeletePageParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.deletePage(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // delete_post
    this.server.tool(
      'delete_post',
      {
        postId: z.number(),
        force: z.boolean().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as DeletePostParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.deletePost(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // set_custom_field
    this.server.tool(
      'set_custom_field',
      {
        id: z.number(),
        type: z.enum(['post', 'page']),
        key: z.string().min(1),
        value: z.any(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as CustomFieldParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.setCustomField(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_custom_fields
    this.server.tool(
      'get_custom_fields',
      {
        id: z.number(),
        type: z.enum(['post', 'page']),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as GetCustomFieldsParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const meta = await wpService.getCustomFields(params);
          return { content: [{ type: 'text', text: JSON.stringify(meta) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // delete_custom_field
    this.server.tool(
      'delete_custom_field',
      {
        id: z.number(),
        type: z.enum(['post', 'page']),
        key: z.string().min(1),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as DeleteCustomFieldParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.deleteCustomField(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // upload_media
    this.server.tool(
      'upload_media',
      {
        fileName: z.string().min(1),
        fileDataBase64: z.string().min(1),
        mimeType: z.string().min(1),
        altText: z.string().optional(),
        title: z.string().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as UploadMediaParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const media: WPMedia = await wpService.uploadMedia(params);
          return { content: [{ type: 'text', text: JSON.stringify(media) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // attach_media
    this.server.tool(
      'attach_media',
      {
        mediaId: z.number(),
        id: z.number(),
        type: z.enum(['post', 'page']),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as AttachMediaParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.attachMedia(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // create_category
    this.server.tool(
      'create_category',
      {
        name: z.string().min(1),
        slug: z.string().optional(),
        description: z.string().optional(),
        parent: z.number().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as CategoryParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const category: WPCategory = await wpService.createCategory(params);
          return { content: [{ type: 'text', text: JSON.stringify(category) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // create_tag
    this.server.tool(
      'create_tag',
      {
        name: z.string().min(1),
        slug: z.string().optional(),
        description: z.string().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as TagParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const tag: WPTag = await wpService.createTag(params);
          return { content: [{ type: 'text', text: JSON.stringify(tag) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // assign_terms
    this.server.tool(
      'assign_terms',
      {
        id: z.number(),
        categories: z.array(z.number()).optional(),
        tags: z.array(z.number()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as AssignTermsParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.assignTerms(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // create_user
    this.server.tool(
      'create_user',
      {
        newUsername: z.string().min(1),
        email: z.string().email(),
        newPassword: z.string().min(1),
        name: z.string().optional(),
        roles: z.array(z.string()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as CreateUserParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const user: WPUser = await wpService.createUser(params);
          return { content: [{ type: 'text', text: JSON.stringify(user) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // update_user
    this.server.tool(
      'update_user',
      {
        userId: z.number(),
        email: z.string().email().optional(),
        newPassword: z.string().optional(),
        name: z.string().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        url: z.string().url().optional(),
        description: z.string().optional(),
        roles: z.array(z.string()).optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as UpdateUserParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const user: WPUser = await wpService.updateUser(params);
          return { content: [{ type: 'text', text: JSON.stringify(user) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // delete_user
    this.server.tool(
      'delete_user',
      {
        userId: z.number(),
        reassign: z.number().optional(),
        force: z.boolean().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as DeleteUserParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          await wpService.deleteUser(params);
          return { content: [{ type: 'text', text: 'OK' }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_user
    this.server.tool(
      'get_user',
      {
        userId: z.number(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as GetUserParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const user: WPUser = await wpService.getUser(params);
          return { content: [{ type: 'text', text: JSON.stringify(user) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );

    // get_users
    this.server.tool(
      'get_users',
      {
        search: z.string().optional(),
        roles: z.array(z.string()).optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        siteUrl: z.string().url().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
      },
      async (args) => {
        try {
          const params = args as GetUsersParams;
          const credentials = await new AuthService().authenticate(params);
          const wpService = new WordPressService(credentials);
          const users: WPUser[] = await wpService.getUsers(params);
          return { content: [{ type: 'text', text: JSON.stringify(users) }] } as any;
        } catch (error) {
          const handled = ErrorHandler.handle(error);
          return { content: [{ type: 'text', text: handled.message }], isError: true } as any;
        }
      }
    );
  }
}


