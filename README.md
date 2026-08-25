# demo-mcp-server

An OAuth Client ID Metadata Document (CIMD) for a throwaway MCP client used to
exercise authorization flows during development.

`docs/client.json` is published via GitHub Pages and its URL is the client's
`client_id`, per
[OAuth Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00)
and
[MCP client registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration).

The redirect URIs are [MCP Inspector](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/authorization)
defaults: port 6276 for the CLI and TUI, port 6274 for the web client.

This repository is public because an authorization server fetches the document
anonymously. It contains no configuration or credentials.
