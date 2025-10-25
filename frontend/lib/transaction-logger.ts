// Transaction logging and history management

export interface Transaction {
  id: string
  type: "enrollment" | "quiz_reward" | "bounty_entry" | "bounty_reward" | "transfer"
  from: string
  to: string
  amount: number
  description: string
  timestamp: number
  transactionHash: string
  status: "pending" | "completed" | "failed"
}

class TransactionLogger {
  private transactions: Transaction[] = []

  logTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Transaction {
    const fullTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
    }

    this.transactions.push(fullTransaction)
    console.log(`[Transaction] ${fullTransaction.description}`, fullTransaction)

    // Persist to localStorage
    this.saveToStorage()

    return fullTransaction
  }

  getTransactionHistory(address: string, limit = 50): Transaction[] {
    return this.transactions
      .filter((tx) => tx.from === address || tx.to === address)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  getTransactionsByType(type: Transaction["type"], address: string): Transaction[] {
    return this.transactions.filter((tx) => tx.type === type && (tx.from === address || tx.to === address))
  }

  private saveToStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("celoTransactions", JSON.stringify(this.transactions))
    }
  }

  loadFromStorage(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("celoTransactions")
      if (stored) {
        this.transactions = JSON.parse(stored)
      }
    }
  }
}

export const transactionLogger = new TransactionLogger()
