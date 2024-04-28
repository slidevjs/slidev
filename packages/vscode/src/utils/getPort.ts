import { getPort as getPortPlease } from 'get-port-please'

export async function getPort() {
  return await getPortPlease({
    port: 3030,
    portRange: [3030, 4000],
  })
}
