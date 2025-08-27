import { Resolver, Query, Args } from '@nestjs/graphql';

/* IMPORTANT: GraphQL Stuff, not being used yet */
@Resolver()
export class AppResolver {
  @Query(() => String)
  helloWorld(): string {
    return 'Hello World!';
  }
  @Query(() => String)
  hello(@Args('name') name: string): string {
    return `Hello ${name}!`;
  }
}
