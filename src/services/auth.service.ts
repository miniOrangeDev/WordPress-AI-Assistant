import type { AuthCredentials, AuthParams, WCAuthCredentials, WCAuthParams } from '../config/schema.js';

export class AuthService {
  async authenticate(params: AuthParams): Promise<AuthCredentials> {
    if (params.username && params.password && params.siteUrl) {
      return {
        username: params.username,
        password: params.password,
        siteUrl: params.siteUrl,
      } as AuthCredentials;
    }

    const envSiteUrl = process.env.WP_SITE_URL;
    const envUsername = process.env.WP_USERNAME;
    const envPassword = process.env.WP_PASSWORD;

    if (!envSiteUrl || !envUsername || !envPassword) {
      throw new Error(
        'Missing authentication credentials. Provide siteUrl, username, and password in params or set WP_SITE_URL, WP_USERNAME, WP_PASSWORD environment variables.'
      );
    }

    return {
      siteUrl: envSiteUrl,
      username: envUsername,
      password: envPassword,
    } as AuthCredentials;
  }

  getAuthHeader(credentials: AuthCredentials): string {
    const token = Buffer.from(
      `${credentials.username}:${credentials.password}`
    ).toString('base64');
    return `Basic ${token}`;
  }

  async authenticateWooCommerce(params: WCAuthParams): Promise<WCAuthCredentials> {
    const siteUrl = params.siteUrl || process.env.WP_SITE_URL;
    const consumerKey = params.wcConsumerKey || process.env.WC_CONSUMER_KEY;
    const consumerSecret = params.wcConsumerSecret || process.env.WC_CONSUMER_SECRET;
    if (!siteUrl || !consumerKey || !consumerSecret) {
      throw new Error('Missing WooCommerce credentials. Provide siteUrl, wcConsumerKey, wcConsumerSecret or set WP_SITE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET.');
    }
    return { siteUrl, consumerKey, consumerSecret } as WCAuthCredentials;
  }
}


