import { getPort as getPortPlease } from 'get-port-please'
import { configuredPort } from '../config'

export async function getPort() {
  return await getPortPlease({
    port: configuredPort.value,
    portRange: [3030, 4000],
  })
}
