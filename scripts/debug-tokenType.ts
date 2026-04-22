import { getMirrorEvents } from '../src/domains/mirror/chainReader'
import { hexToString } from 'viem'

async function run() {
  const events = await getMirrorEvents()

  if (!events.length) {
    console.log('No events found')
    return
  }

  const e = events[0]

  console.log('--- RAW EVENT ---')
  console.log('tokenType raw:', e.args.tokenType)
  console.log('walletEventId:', e.args.walletEventId)

  const tokenType = e.args.tokenType
  if (!tokenType) {
    console.log('tokenType is undefined')
    return
  }

  try {
    const decoded = hexToString(tokenType)
    console.log('decoded tokenType:', decoded)
  } catch {
    console.log('decode failed → likely hashed or non-text bytes32')
  }
}

run()
