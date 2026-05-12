export type CFState = {
  transfers: any[]
  transactions: any[]
  escrows: any[]
  disputes: any[]
  settlements: any[]

  liquidityIndex: number
  systemStress: number

  timestamp: number
}