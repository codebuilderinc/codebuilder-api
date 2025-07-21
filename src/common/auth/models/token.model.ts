import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJWT } from 'graphql-scalars';
import { getAddress } from 'viem';
const J = require('joi');

@ObjectType()
export class Token {
  @Field(() => GraphQLJWT, { description: 'JWT access token' })
  accessToken: string;

  @Field(() => GraphQLJWT, { description: 'JWT refresh token' })
  refreshToken: string;
}

/* Old Webserve Authentication Evgy Code (Temporarily being used until can build out proper auth system) */

function checksum(address) {
  return getAddress(address);
}
const _checksum_anti_access = (value, helper) => {
  try {
    if (BigInt(value) > MIN_ADDRESS && value === checksum(value)) {
      if (helper.state.ancestors[0].access_token === ZERO_HASH) {
        return IMAGINARY_PEG;
      }
      return value;
    }
  } catch (e) {}

  return helper.message('Invalid address');
};

const ALLOWED_CHAINS = ['BSC'];
const ALLOWED_QUERIES = ['BS', 'TX', 'HOT', 'NEW'];
const ALLOWED_NFT_TYPES = ['JBU', 'JBS', 'JBW', 'JBD', 'JBA', 'JBR'];
const DEFAULT_CHAIN = 'BSC';
const MIN_ADDRESS = BigInt(2 ** 20); // Above 0xffff
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const IMAGINARY_PEG = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const _checksum = (value, helper) => {
  try {
    if (BigInt(value) > MIN_ADDRESS && value === checksum(value)) {
      return value;
    }
  } catch (e) {}

  return helper.message('Invalid address');
};

const _hex = (value, helper) => {
  return (/^(0x)?[0-9a-f]+$/.test(value) && value) || helper.message('Invalid hex');
};

const _bool = (value, helper) => {
  return !!value;
};

const nonce_scheme = J.object({
  wallet: J.required().custom(_checksum),
  chain: J.string()
    .allow('')
    .default(DEFAULT_CHAIN)
    .valid(...ALLOWED_CHAINS),
})
  .rename('w', 'wallet')
  .rename('c', 'chain');

const auth_scheme = nonce_scheme
  .keys({
    signature: J.string().min(64).max(1024).custom(_hex).required(),
    affiliate: J.number().min(0).max(1000000000), // JBU ID
    is_nft: J.custom(_bool),
  })
  .rename('s', 'signature')
  .rename('AF', 'affiliate')
  .rename('_n', 'is_nft');

const authed_scheme = J.object({
  access_token: J.string().allow('').default(ZERO_HASH).min(64).max(66).custom(_hex),
  wallet: J.string().allow('').default(IMAGINARY_PEG).custom(_checksum_anti_access),
  chain: J.string()
    .allow('')
    .default(DEFAULT_CHAIN)
    .valid(...ALLOWED_CHAINS),
})
  .rename('w', 'wallet')
  .rename('c', 'chain')
  .rename('a', 'access_token');
