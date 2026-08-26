import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { config } from './config.js';

/** The scope each tool demands. `echo` deliberately needs more than the endpoint
 *  itself, so a read-only token can reach the server and still be refused. */
export const TOOL_SCOPES: Record<string, string> = {
  whoami: config.scopes.read,
  echo: config.scopes.write,
};

export function createServer(): McpServer {
  const server = new McpServer(
    { name: 'demo-mcp-server', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'whoami',
    {
      title: 'Who am I',
      description: 'Report the identity and Organization carried by the access token.',
      inputSchema: {},
    },
    async (_args, extra) => {
      const claims = extra.authInfo?.extra ?? {};
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                sub: claims.sub,
                org_id: claims.org_id,
                client_id: extra.authInfo?.clientId,
                scopes: extra.authInfo?.scopes,
                aud: claims.aud,
                iss: claims.iss,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    'echo',
    {
      title: 'Echo',
      description: 'Return the given message. Requires mcp:write.',
      inputSchema: { message: z.string().describe('Text to echo back') },
    },
    async ({ message }) => ({ content: [{ type: 'text', text: message }] }),
  );

  return server;
}
