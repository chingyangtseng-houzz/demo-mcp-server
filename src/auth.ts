import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { config, jwksUri } from './config.js';

const jwks = createRemoteJWKSet(jwksUri);

/** A token is only good enough if it names an Organization. Without one there is
 *  no team boundary, and no tool can decide what data it is allowed to see. */
export const verifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, jwks, {
        issuer: config.issuer,
        audience: config.resource,
      }));
    } catch (error) {
      throw new InvalidTokenError(
        `token rejected: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const orgId = payload.org_id;
    if (typeof orgId !== 'string' || orgId.length === 0) {
      throw new InvalidTokenError('token carries no org_id; no team boundary to work within');
    }

    return {
      token,
      clientId: typeof payload.azp === 'string' ? payload.azp : String(payload.client_id ?? ''),
      scopes: typeof payload.scope === 'string' ? payload.scope.split(' ').filter(Boolean) : [],
      expiresAt: payload.exp,
      resource: new URL(config.resource),
      extra: { sub: payload.sub, org_id: orgId, iss: payload.iss, aud: payload.aud },
    };
  },
};
