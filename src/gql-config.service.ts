import { GraphqlConfig } from './common/configs/config.interface';
import { ConfigService } from './common/configs/config.service';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
    constructor(private configService: ConfigService) {}
    createGqlOptions(): ApolloDriverConfig {
        const graphqlConfig = this.configService.get('graphql');
        return {
            // schema options
            autoSchemaFile: graphqlConfig.schemaDestination || './src/schema.graphql',
            sortSchema: graphqlConfig.sortSchema,
            buildSchemaOptions: {
                numberScalarMode: 'integer',
            },
            // subscription
            installSubscriptionHandlers: true,
            includeStacktraceInErrorResponses: graphqlConfig.debug,
            playground: graphqlConfig.playgroundEnabled,
            context: ({ req }) => ({ req }),
        };
    }
}
