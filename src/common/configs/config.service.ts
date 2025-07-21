import { Injectable } from '@nestjs/common';
import { ApplicationConfig } from './config.interface';
import { loadConfig } from './config.helper';

/**
 * Parses and interfaces with environment variable configs
 *
 * @export
 * @class ConfigService
 */
@Injectable()
export class ConfigService {
    private readonly applicationConfig: ApplicationConfig;

    constructor() {
        this.applicationConfig = loadConfig();

        // We freeze the config to prevent modification
        Object.freeze(this.applicationConfig);
    }

    /**
     * Returns the value of a specified environment config
     *
     * @template T
     * @param {T} configName
     * @returns {ApplicationConfig[T]}
     * @memberof ConfigService
     */
    get<T extends keyof ApplicationConfig>(configName: T): ApplicationConfig[T] {
        return this.applicationConfig[configName];
    }

    /**
     * Returns entire environment config
     *
     * @returns {ApplicationConfig}
     * @memberof ConfigService
     */
    getConfigs(): ApplicationConfig {
        return this.applicationConfig;
    }
}
