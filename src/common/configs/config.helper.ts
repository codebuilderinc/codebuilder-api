import dotenv from 'dotenv';
import fs from 'fs';
import Joi from 'joi';
import { ApplicationConfig, Config } from './config.interface';
import config from './config';

export function loadConfig() {
    const filePath = `.env`; //${process.env.NODE_ENV || 'local'}

    // Try to read and parse the file
    let file = Buffer.from('');
    try {
        file = fs.readFileSync(filePath);
    } catch {
        /* empty */
    }

    const dotenvConfig = dotenv.parse(file);

    // Parse nested JSON in file and merge with process.env
    const parsedConfig = parseNestedJson({
        ...dotenvConfig,
        ...process.env,
        ...config(),
    });
    // Validate the config
    return validateConfig(parsedConfig);
}

/**
 * Parses environment variable JSON strings into JS objects
 */
function parseNestedJson(config: any): ApplicationConfig {
    return Object.keys(config).reduce((accumulator, configKey) => {
        try {
            accumulator[configKey] = JSON.parse(config[configKey]);
        } catch {
            /* empty */
        }

        return config;
    }, config);
}

/**
 * Ensures all needed variables are set, and returns the validated JavaScript object
 * including the applied default values.
 */
function validateConfig(envConfig: object): ApplicationConfig {
    const envVarsSchema: Joi.ObjectSchema<ApplicationConfig> = Joi.object<ApplicationConfig>({
        SERVICE_NAME: Joi.string().required(),
        SERVICE_VERSION: Joi.string().required(),
        SERVICE_ENVIRONMENT: Joi.string().default('DEVELOPMENT'),

        PORT: Joi.number().min(1024).required(),

        NODE_ENV: Joi.string().default('local'),

        DATABASE_URL: Joi.string().required(),
        MONGO_DATABASE_URL: Joi.string().required(),

        LOG_ELASTICSEARCH_NODE: Joi.string(),

        S3_REGION: Joi.string().required(),
        S3_ACCESS_KEY_ID: Joi.string().required(),
        S3_SECRET_ACCESS_KEY: Joi.string().required(),
        S3_BASE_ENDPOINT: Joi.string().required(),
        S3_USER_BUCKET: Joi.string().required(),

        QUEUE_REDIS_HOST: Joi.string().required(),
        QUEUE_REDIS_PASSWORD: Joi.string(),
        QUEUE_REDIS_PORT: Joi.number().required(),
        QUEUE_REDIS_USE_TLS: Joi.boolean().default(false),
        QUEUE_RETRY_INTERVAL: Joi.number().default(5000),

        SMARTCHAIN_RPC_HOST: Joi.string().default('https://explorer-api.devnet.solana.com'),

        OPEN_TELEMETRY_ZIPKIN_ENABLED: Joi.boolean().default(false),
        OPEN_TELEMETRY_PROMETHEUS_ENABLED: Joi.boolean().default(false),
        OPEN_TELEMETRY_COLLECTOR_URL: Joi.string().uri(),
        OPEN_TELEMETRY_LIGHTSTEP_ACCESS_TOKEN: Joi.string(),

        JWT_ACCESS_SECRET: Joi.string().default('secretkey'),
        JWT_EXPIRATION_TIME: Joi.string().default('60m'),

        JWT_REFRESH_TOKEN_SECRET: Joi.string().default('refreshTokenSecretkey'),
        JWT_REFRESH_EXPIRATION_TIME: Joi.string().default('60m'),

        EDGE_KV_URL: Joi.string().default('https://edge-kv-dexcelerate.workers.dev'),
        EDGE_KV_AUTHORIZATION_TOKEN: Joi.string().default(''),
        REDIS_SERVERS: Joi.string().required(), // JSON string validated as plain string here
    });

    const { error, value: validatedConfig } = envVarsSchema.validate(envConfig, {
        allowUnknown: true,
    });

    if (error) {
        throw new Error(`Config validation error: ${error.message}`);
    }

    return validatedConfig;
}
