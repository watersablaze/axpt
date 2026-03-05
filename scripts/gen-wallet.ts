import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const pk = generatePrivateKey()
const account = privateKeyToAccount(pk)

console.log('PRIVATE_KEY=', pk)
console.log('ADDRESS=', account.address)