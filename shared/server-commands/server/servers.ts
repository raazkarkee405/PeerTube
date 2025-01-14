import { ensureDir } from 'fs-extra'
import { isGithubCI } from '@shared/core-utils'
import { PeerTubeServer, RunServerOptions } from './server'

async function createSingleServer (serverNumber: number, configOverride?: Object, options: RunServerOptions = {}) {
  const server = new PeerTubeServer({ serverNumber })

  await server.flushAndRun(configOverride, options)

  return server
}

function createMultipleServers (totalServers: number, configOverride?: Object, options: RunServerOptions = {}) {
  const serverPromises: Promise<PeerTubeServer>[] = []

  for (let i = 1; i <= totalServers; i++) {
    serverPromises.push(createSingleServer(i, configOverride, options))
  }

  return Promise.all(serverPromises)
}

async function killallServers (servers: PeerTubeServer[]) {
  return Promise.all(servers.map(s => s.kill()))
}

async function cleanupTests (servers: PeerTubeServer[]) {
  await killallServers(servers)

  if (isGithubCI()) {
    await ensureDir('artifacts')
  }

  let p: Promise<any>[] = []
  for (const server of servers) {
    p = p.concat(server.servers.cleanupTests())
  }

  return Promise.all(p)
}

function getServerImportConfig (mode: 'youtube-dl' | 'yt-dlp') {
  return {
    import: {
      videos: {
        http: {
          youtube_dl_release: {
            url: mode === 'youtube-dl'
              ? 'https://yt-dl.org/downloads/latest/youtube-dl'
              : 'https://api.github.com/repos/yt-dlp/yt-dlp/releases',

            name: mode
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------

export {
  createSingleServer,
  createMultipleServers,
  cleanupTests,
  killallServers,
  getServerImportConfig
}
