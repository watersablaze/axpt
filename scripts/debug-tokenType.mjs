import { getMirrorEvents } from '../src/domains/mirror/chainReader.js'
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

  const tokenType = e.args.tokenType
  if (!tokenType) {
    console.log('tokenType is undefined')
    return
  }

  try {
    console.log('decoded:', hexToString(tokenType))
  } catch {
    console.log('decode failed → likely hashed')
  }
}

run()
