import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from './../common/configs/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { KvNamespaces } from './models/kv-namespaces.enum';

@Injectable()
export class CloudflareKvService implements OnModuleInit {
  private edgeKvUrl: string;
  private authorizationToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {}

  onModuleInit() {
    this.edgeKvUrl = this.configService.get('EDGE_KV_URL');
    this.authorizationToken = this.configService.get('EDGE_KV_AUTHORIZATION_TOKEN');
  }

  async createKeyValueForNamespace(namespace: KvNamespaces, key: string, value?: string | object) {
    try {
      const requestOptions = {
        method: 'POST',
        headers: {
          authorizationToken: this.authorizationToken,
        },
      };

      const response = await fetch(`${this.edgeKvUrl}/${namespace}/${key}`, requestOptions);

      return response;
    } catch (e) {
      this.logger.error('Failed to update workers KV', {
        errorMessage: e.message,
      });
    }
  }

  async deleteKeyForNamespace(namespace: KvNamespaces, key: string) {
    try {
      const requestOptions = {
        method: 'DELETE',
        headers: {
          authorizationToken: this.authorizationToken,
        },
      };

      const response = await fetch(`${this.edgeKvUrl}/${namespace}/${key}`, requestOptions);

      return response.json();
    } catch (e) {
      this.logger.error('Failed to update workers KV', {
        errorMessage: e.message,
      });
    }
  }
}
