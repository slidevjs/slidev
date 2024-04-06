import onml from 'onml'
import wavedrom from 'wavedrom'
import def from 'wavedrom/skins/default'
import * as narrow from 'wavedrom/skins/narrow'
import * as lowkey from 'wavedrom/skins/lowkey'
import json5 from 'json5'

import lz from 'lz-string'
import { makeId } from '../logic/utils'

const skins = Object.assign({}, def, narrow, lowkey)
skins.default = def.default

const cache = new Map<string, string>()

export async function renderWavedrom(lzEncoded: string, options: any) {
  const key = lzEncoded + JSON.stringify(options)
  const _cache = cache.get(key)
  if (_cache)
    return _cache

  const code = json5.parse(lz.decompressFromBase64(lzEncoded))
  const id = makeId()

  const res = wavedrom.renderAny(0, code, skins)
  if (res && res[1])
    res[1].id = id

  const svg = onml.s(res)
  cache.set(key, svg)

  return svg
}
