#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ToolSchema,
} from '@modelcontextprotocol/sdk/types.js'

// Define available tools
const TOOLS: ToolSchema[] = [
    {
        name: 'hello_world',
        description: 'A simple hello world tool',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name to greet',
                },
            },
            required: ['name'],
        },
    },
    {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'Message to echo',
                },
            },
            required: ['message'],
        },
    },
    {
        name: 'get_time',
        description: 'Get the current time',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
]

class BootstrapMCPServer {
    private server: Server

    constructor() {
        this.server = new Server(
            {
                name: 'bootstrap-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        )

        this.setupHandlers()
    }

    private setupHandlers() {
        // Handle tool listing
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: TOOLS,
        }))

        // Handle tool execution
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params

            try {
                switch (name) {
                    case 'hello_world':
                        return this.handleHelloWorld(args)
                    case 'echo':
                        return this.handleEcho(args)
                    case 'get_time':
                        return this.handleGetTime()
                    default:
                        throw new Error(`Unknown tool: ${name}`)
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                }
            }
        })
    }

    private handleHelloWorld(args: any) {
        const name = args.name as string
        return {
            content: [
                {
                    type: 'text',
                    text: `Hello, ${name}! Welcome to the Bootstrap MCP Server.`,
                },
            ],
        }
    }

    private handleEcho(args: any) {
        const message = args.message as string
        return {
            content: [
                {
                    type: 'text',
                    text: message,
                },
            ],
        }
    }

    private handleGetTime() {
        const now = new Date()
        return {
            content: [
                {
                    type: 'text',
                    text: `Current time: ${now.toISOString()}`,
                },
            ],
        }
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('Bootstrap MCP Server running...')
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new BootstrapMCPServer()
    server.run().catch((error) => {
        console.error('Server error:', error)
        process.exit(1)
    })
}