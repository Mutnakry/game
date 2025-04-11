export type GameResult = {
    id?: string
    userId: string
    crashPoint: number
    winRate: number
    expectedValue: number
    betAmount: number
    timestamp: Date
    didWin?: boolean
    cashoutMultiplier?: number
    profit?: number
  }
  