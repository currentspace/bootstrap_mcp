#!/usr/bin/env node

import type { ChildProcess } from 'child_process'
import { spawn } from 'child_process'
import * as readline from 'readline'
import * as fs from 'fs'

const DEBUG = process.env.DEBUG === 'true'
const LOG_FILE = '/tmp/bootstrap-mcp-proxy.log'

function log(message: string) {
    if (DEBUG) {
        fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} - ${message}\n`)
    }
}

class MCPProxy {
    private serverProcess: ChildProcess | null = null
    private inputBuffer: string[] = []
    private outputBuffer: string[] = []
    private isRestarting = false
    private rl: readline.Interface

    constructor() {
        // Set up readline interface for stdin
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        })

        // Handle input from Claude
        this.rl.on('line', (line) => {
            log(`Received from Claude: ${line}`)
            if (this.isRestarting) {
                // Buffer input during restart
                this.inputBuffer.push(line)
            } else if (this.serverProcess && !this.serverProcess.killed) {
                // Forward to server
                this.serverProcess.stdin?.write(line + '\n')
            }
        })

        // Handle process termination
        process.on('SIGTERM', () => this.cleanup())
        process.on('SIGINT', () => this.cleanup())
        process.on('SIGHUP', () => this.reload())
    }

    async start() {
        log('Starting MCP proxy...')
        await this.startServer()
    }

    private async startServer() {
        log('Starting server process...')

        // Spawn the actual MCP server
        this.serverProcess = spawn('node', ['dist/server.js'], {
            cwd: process.cwd(),
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe'],
        })

        // Handle server output
        this.serverProcess.stdout?.on('data', (data) => {
            const output = data.toString()
            log(`Server output: ${output}`)
            if (!this.isRestarting) {
                process.stdout.write(data)
            } else {
                // Buffer output during restart
                this.outputBuffer.push(output)
            }
        })

        // Handle server errors
        this.serverProcess.stderr?.on('data', (data) => {
            const error = data.toString()
            log(`Server error: ${error}`)
            fs.appendFileSync('/tmp/bootstrap-mcp-debug.log', error)
        })

        // Handle server exit
        this.serverProcess.on('exit', (code, signal) => {
            log(`Server exited with code ${code}, signal ${signal}`)
            if (!this.isRestarting) {
                // Unexpected exit - restart
                setTimeout(() => this.startServer(), 1000)
            }
        })

        // Process any buffered input
        while (this.inputBuffer.length > 0) {
            const line = this.inputBuffer.shift()
            if (line && this.serverProcess.stdin) {
                this.serverProcess.stdin.write(line + '\n')
            }
        }

        // Process any buffered output
        while (this.outputBuffer.length > 0) {
            const output = this.outputBuffer.shift()
            if (output) {
                process.stdout.write(output)
            }
        }

        this.isRestarting = false
    }

    private async reload() {
        log('Reloading server...')
        this.isRestarting = true

        // Kill the current server
        if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGTERM')

            // Wait for process to exit
            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.serverProcess || this.serverProcess.killed) {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 100)

                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.serverProcess && !this.serverProcess.killed) {
                        this.serverProcess.kill('SIGKILL')
                    }
                }, 5000)
            })
        }

        // Rebuild the project
        log('Rebuilding project...')
        const buildProcess = spawn('pnpm', ['run', 'build'], {
            cwd: process.cwd(),
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        await new Promise<void>((resolve) => {
            buildProcess.on('exit', () => {
                log('Build complete')
                resolve()
            })
        })

        // Restart the server
        await this.startServer()
    }

    private cleanup() {
        log('Cleaning up...')
        if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGTERM')
        }
        process.exit(0)
    }
}

// Start the proxy
const proxy = new MCPProxy()
proxy.start().catch((error) => {
    console.error('Failed to start proxy:', error)
    process.exit(1)
})