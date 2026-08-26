/** All settings in one place; every one is overridable so the same build can be
 *  pointed at a different tenant or resource while probing. */
export const config = {
  port: Number(process.env.PORT ?? 3001),

  /** Where the server is actually reachable. Used only to build the
   *  `resource_metadata` URL in the 401 challenge, which must be fetchable by
   *  the client, so it is the listening origin rather than the resource id. */
  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:3001',

  /** The resource identifier: the Auth0 API identifier and the `aud` every
   *  accepted token must carry. It has to equal the URL clients actually
   *  connect to — the Inspector refuses a protected-resource document whose
   *  `resource` names anything else — so a locally hosted server must claim a
   *  local identity, and the tenant needs a matching API. */
  resource: process.env.MCP_RESOURCE ?? 'http://localhost:3001/mcp',

  issuer: process.env.AUTH0_ISSUER ?? 'https://houzz-staging.us.auth0.com/',

  scopes: {
    read: 'mcp:read',
    write: 'mcp:write',
  },

  /** What the protected-resource document advertises. Normally both scopes;
   *  narrowing it is how a step-up is provoked, since a client asks for what the
   *  document lists and nothing more. */
  advertisedScopes: (process.env.MCP_PRM_SCOPES ?? 'mcp:read mcp:write').split(' ').filter(Boolean),
} as const;

export const jwksUri = new URL('.well-known/jwks.json', config.issuer);
