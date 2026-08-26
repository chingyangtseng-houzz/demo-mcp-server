# demo-mcp-server

A throwaway MCP server and client metadata document, used to exercise OAuth
authorization end to end during development. Nothing here is production code.

## The server

`src/` serves MCP over streamable HTTP behind Auth0-issued bearer tokens:

| Path | Behaviour |
| :---- | :---- |
| `POST /mcp` | MCP endpoint. Unauthenticated requests get `401` with a `WWW-Authenticate` challenge naming the metadata document |
| `GET /.well-known/oauth-protected-resource/mcp` | [RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728) protected resource metadata |

Tokens are verified against the tenant JWKS on `iss`, `exp` and `aud`, and a
token naming no Organization is refused: without one there is no team boundary
to work within. Two tools demand different scopes — `whoami` needs `mcp:read`
and reports the identity the token carried, `echo` needs `mcp:write` — so an
under-scoped call produces a real `403` with `insufficient_scope`.

```
nvm use 22 && npm install
npm run dev
```

Settings live in `src/config.ts` and every one is overridable by environment
variable. The resource identifier must equal the URL clients actually connect
to; clients reject a metadata document that names anything else.

## The metadata document

`docs/client.json` is published via GitHub Pages and its URL is the client's
`client_id`, per
[OAuth Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)
and
[MCP client registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration).

The redirect URIs are [MCP Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/authorization)
defaults: port 6276 for the CLI and TUI, port 6274 for the web client.

This repository is public because an authorization server fetches the document
anonymously. It contains no configuration or credentials.
