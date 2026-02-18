export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  security: SecurityConfig;
}

export interface NestConfig {
  port: number;
}

export interface CorsConfig {
  enabled: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
}

export interface SecurityConfig {
  expiresIn: string;
  refreshIn: string;
  bcryptSaltOrRound: string | number;
}

export interface ApplicationConfig {
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  security: SecurityConfig;

  SERVICE_NAME: string;
  SERVICE_VERSION: string;
  SERVICE_ENVIRONMENT: 'DEVELOPMENT' | 'CI' | 'STAGING' | 'PRODUCTION';

  PORT: number;

  NODE_ENV: string;

  DATABASE_URL: string;
  MONGO_DATABASE_URL: string;

  // Log
  LOG_ELASTICSEARCH_NODE?: string;
  REDIS_SERVERS: string;

  // S3 compatible storage settings
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_BASE_ENDPOINT: string;
  S3_USER_BUCKET: string;

  QUEUE_REDIS_HOST: string;
  QUEUE_REDIS_PASSWORD: string;
  QUEUE_REDIS_PORT: number;
  QUEUE_REDIS_USE_TLS?: boolean;
  QUEUE_RETRY_INTERVAL?: number;

  SMARTCHAIN_RPC_HOST: string;

  ETHEREUM_ALCHEMY_API_URL: string;
  ETHEREUM_ALCHEMY_API_KEY: string;
  NEXTAUTH_SECRET: string;

  OPEN_TELEMETRY_ZIPKIN_ENABLED?: boolean;
  OPEN_TELEMETRY_PROMETHEUS_ENABLED?: boolean;
  OPEN_TELEMETRY_COLLECTOR_URL?: string;
  OPEN_TELEMETRY_LIGHTSTEP_ACCESS_TOKEN?: string;

  JWT_ACCESS_SECRET: string;
  JWT_EXPIRATION_TIME: string;

  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_EXPIRATION_TIME: string;

  EDGE_KV_URL: string;
  EDGE_KV_AUTHORIZATION_TOKEN: string;
}

export interface UnflattenApplicationConfig {
  name: string;
  children: string[];
}
