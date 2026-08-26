import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePublicIpv4 } from './publicIp'

const mocks = vi.hoisted(() => ({
  publicIpv4: vi.fn(),
}))

vi.mock('public-ip', () => ({
  publicIpv4: mocks.publicIpv4,
}))

describe('resolvePublicIpv4', () => {
  beforeEach(() => {
    mocks.publicIpv4.mockReset()
  })

  it('returns the public IPv4 address when lookup succeeds', async () => {
    mocks.publicIpv4.mockResolvedValue('203.0.113.10')
    await expect(resolvePublicIpv4()).resolves.toBe('203.0.113.10')
  })

  it('returns undefined instead of throwing when public IPv4 cannot be determined', async () => {
    mocks.publicIpv4.mockRejectedValue(new DOMException('The operation was aborted.'))
    await expect(resolvePublicIpv4()).resolves.toBeUndefined()
  })
})
