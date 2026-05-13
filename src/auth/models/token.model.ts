//import { Field, ObjectType } from '@nestjs/graphql';
//import { GraphQLJWT } from 'graphql-scalars';
//const J = require('joi');

//@ObjectType()
export class Token {
  //@Field(() => GraphQLJWT, { description: 'JWT access token' })
  accessToken: string;

  //@Field(() => GraphQLJWT, { description: 'JWT refresh token' })
  refreshToken: string;
}
