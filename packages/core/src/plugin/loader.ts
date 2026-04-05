import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { getEnv } from '../config/env.js'
import { loadPlugin, getLoadedPlugins } from './sandbox.js'

interface PluginRegistryEntry {
  name: string
  path: string
  checksum?: string
  enabled: boolean
}

/**
 * Scan the plugin directory and load all enabled plugins.
 * Looks for: src/plugins/<name>/index.js  or  src/plugins/<name>.js
 */
export async function loadPlugins(tenantId: string): Promise<void> {
  const env = getEnv()
  const pluginDir = path.resolve(env.PLUGIN_DIR)

  let entries: string[]
  try {
    entries = await readdir(pluginDir)
  } catch {
    // Plugin dir doesn't exist — no plugins to load
    return
  }

  const registry = await loadRegistry(pluginDir)

  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'registry.json') continue

    const fullPath = path.join(pluginDir, entry)
    const isDir = !entry.includes('.')

    let pluginFile: string
    if (isDir) {
      pluginFile = path.join(fullPath, 'index.js')
    } else if (entry.endsWith('.js')) {
      pluginFile = fullPath
    } else {
      continue
    }

    const pluginName = entry.replace('.js', '')
    const registryEntry = registry[pluginName]

    // Skip if explicitly disabled
    if (registryEntry && !registryEntry.enabled) {
      console.log(`🧩 Plugin "${pluginName}" is disabled, skipping.`)
      continue
    }

    try {
      await loadPlugin(pluginFile, tenantId, registryEntry?.checksum)
    } catch (err) {
      console.error(`❌ Failed to load plugin "${pluginName}":`, err)
    }
  }
}

async function loadRegistry(pluginDir: string): Promise<Record<string, PluginRegistryEntry>> {
  const registryPath = path.join(pluginDir, 'registry.json')
  try {
    const content = await readFile(registryPath, 'utf8')
    return JSON.parse(content) as Record<string, PluginRegistryEntry>
  } catch {
    return {}
  }
}

export { getLoadedPlugins }
