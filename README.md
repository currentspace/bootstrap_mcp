# Bootstrap MCP Server

A minimal MCP (Model Context Protocol) server template with hot reload support for development.

## Features

- **Hot Reload Proxy**: Maintains connection with Claude while allowing server restarts
- **Common Tool Patterns**: Example implementations of typical MCP tools
- **TypeScript Support**: Full TypeScript with strict type checking
- **Fast Build System**: Uses esbuild for quick compilation
- **Development Ready**: Configured with ESLint and Prettier

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm run build
   ```

3. Start the MCP server:
   ```bash
   ./start_mcp.sh
   ```

4. To reload the server during development:
   ```bash
   ./reload_mcp.sh
   ```

## Project Structure

```
bootstrap_mcp/
├── src/
│   ├── server.ts    # Main MCP server implementation
│   └── proxy.ts     # Hot reload proxy
├── dist/            # Compiled JavaScript output
├── build.mjs        # Build configuration
├── tsconfig.json    # TypeScript configuration
├── package.json     # Project dependencies
├── start_mcp.sh     # Start script with proxy
└── reload_mcp.sh    # Reload script for development
```

## Available Tools

The bootstrap includes three example tools:

1. **hello_world**: Simple greeting tool
2. **echo**: Echo back messages
3. **get_time**: Get current timestamp

## Development Workflow

1. Make changes to `src/server.ts`
2. Run `./reload_mcp.sh` to rebuild and restart
3. The proxy maintains the Claude connection during restart
4. Check `/tmp/bootstrap-mcp-debug.log` for debugging

## Adding New Tools

1. Add tool definition to `TOOLS` array in `server.ts`
2. Implement handler method in `BootstrapMCPServer` class
3. Add case in `CallToolRequestSchema` handler
4. Reload the server

## Scripts

- `pnpm run dev`: Development mode with tsx watch
- `pnpm run build`: Build TypeScript to JavaScript
- `pnpm run typecheck`: Type checking only
- `pnpm run lint`: Run ESLint
- `pnpm run format`: Format code with Prettier

## Requirements

- Node.js v24+
- pnpm package manager