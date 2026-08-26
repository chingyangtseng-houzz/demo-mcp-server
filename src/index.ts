import express, { type NextFunction, type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { config } from './config.js';
import { verifier } from './auth.js';
import { createServer, TOOL_SCOPES } from './server.js';

const MCP_PATH = '/mcp';
const PRM_PATH = '/.well-known/oauth-protected-resource/mcp';
const resourceMetadataUrl = new URL(PRM_PATH, config.publicUrl).toString();

const app = express();
app.use(express.json());

/** Every request is worth seeing: the point of the exercise is watching what a
 *  client does when it is told nothing out of band. */
app.use((req, _res, next) => {
  const auth = req.header('authorization');
  const body = req.body as { method?: string; params?: { name?: string } } | undefined;
  console.log(
    `[${req.method}] ${req.originalUrl}` +
      (body?.method ? ` rpc=${body.method}${body.params?.name ? `/${body.params.name}` : ''}` : '') +
      ` auth=${auth ? `${auth.slice(0, 16)}…` : 'none'}`,
  );
  next();
});

// RFC 9728. `offline_access` is left out on purpose: it is an Auth0 grant
// modifier, not a permission on this resource, and advertising it invites
// clients to ask the authorization server for something we do not own.
app.get(PRM_PATH, (_req, res) => {
  res.json({
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: config.advertisedScopes,
    bearer_methods_supported: ['header'],
  });
});

const requireAuth = requireBearerAuth({
  verifier,
  requiredScopes: [config.scopes.read],
  resourceMetadataUrl,
});

/** Scope is enforced at the HTTP layer so that an under-scoped call produces a
 *  real 403 with a challenge the client can act on, rather than a tool error
 *  buried in a 200 response. The challenge names every scope the call needs. */
function requireToolScope(req: Request, res: Response, next: NextFunction) {
  const calls = (Array.isArray(req.body) ? req.body : [req.body]) as Array<{
    method?: string;
    params?: { name?: string };
  }>;

  for (const call of calls) {
    if (call?.method !== 'tools/call') continue;
    const needed = TOOL_SCOPES[call.params?.name ?? ''];
    if (!needed || req.auth?.scopes.includes(needed)) continue;

    const scopes = [config.scopes.read, needed].filter((s, i, a) => a.indexOf(s) === i).join(' ');
    res.setHeader(
      'WWW-Authenticate',
      `Bearer error="insufficient_scope", ` +
        `error_description="tool ${call.params?.name} requires ${needed}", ` +
        `scope="${scopes}", resource_metadata="${resourceMetadataUrl}"`,
    );
    res.status(403).json({
      error: 'insufficient_scope',
      error_description: `tool ${call.params?.name} requires ${needed}`,
    });
    return;
  }
  next();
}

app.post(MCP_PATH, requireAuth, requireToolScope, async (req, res) => {
  // Stateless: a server and transport per request, so nothing survives between
  // calls and every request re-proves its token.
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(config.port, () => {
  console.log(`demo-mcp-server on ${config.publicUrl}${MCP_PATH}`);
  console.log(`  resource   ${config.resource}`);
  console.log(`  issuer     ${config.issuer}`);
  console.log(`  metadata   ${resourceMetadataUrl}`);
});
