import * as esbuild from 'esbuild'
import { readdir } from 'fs/promises'
import { join } from 'path'

const srcDir = './src'
const outDir = './dist'

// Find all TypeScript entry points
async function findEntryPoints(dir) {
    const entries = []
    const files = await readdir(dir, { withFileTypes: true })

    for (const file of files) {
        const path = join(dir, file.name)
        if (file.isDirectory()) {
            entries.push(...(await findEntryPoints(path)))
        } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
            entries.push(path)
        }
    }

    return entries
}

const entryPoints = await findEntryPoints(srcDir)

const buildOptions = {
    entryPoints,
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    outdir: outDir,
    outExtension: { '.js': '.js' },
    packages: 'external',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
}

try {
    await esbuild.build(buildOptions)
    console.log('Build complete!')
} catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
}