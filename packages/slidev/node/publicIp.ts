export async function resolvePublicIpv4(): Promise<string | undefined> {
  try {
    const { publicIpv4 } = await import('public-ip')
    return await publicIpv4()
  }
  catch {
    return undefined
  }
}
