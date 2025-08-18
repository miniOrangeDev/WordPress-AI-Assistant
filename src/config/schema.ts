export interface WPConfig {
  siteUrl: string;
  username: string;
  password: string;
  apiVersion?: string; // default v2
}

export interface AuthCredentials {
  siteUrl: string;
  username: string;
  password: string;
}

export interface AuthParams {
  siteUrl?: string;
  username?: string;
  password?: string;
}

export interface WCAuthParams extends AuthParams {
  wcConsumerKey?: string;
  wcConsumerSecret?: string;
}

export interface WCAuthCredentials {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
}


