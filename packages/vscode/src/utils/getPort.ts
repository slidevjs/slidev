import { getPort as getPortPlease } from 'get-port-please'
import { noNull } from '@antfu/utils'
import { configuredPort } from '../config'
import { projects } from '../projects'

export async function getPort() {
  const usedPorts = [...projects.values()].map(project => project.port).filter(noNull)
  const minPort = Math.max(configuredPort.value - 1, ...usedPorts) + 1
  return await getPortPlease({
    portRange: [minPort, 4000],
  })
}
