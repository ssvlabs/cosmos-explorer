/**
 * PowerReduction is the factor by which token amounts are divided to calculate voting power.
 * This is commonly used in staking and governance calculations.
 */
export const PowerReduction = 1_000_000;


export interface Key {
    "@type": string,
    "key": string,
}

export enum LoadingStatus {
    UNLOADED,
    LOADING,
    LOADED,
}

export interface Pagination {
    next_key?: string;
    total?: string;
}

export class PageRequest {
    key?: string;
    limit: number;
    offset?: number;
    count_total: boolean;
    reverse?: boolean;
    constructor() {
        this.limit = 20
        this.count_total = true
    }
    toQueryString() {
        const query = []
        if(this.key) query.push(`pagination.key=${this.key}`)
        if(this.limit) query.push(`pagination.limit=${this.limit}`)
        if(this.offset !== undefined) query.push(`pagination.offset=${this.offset}`)
        if(this.count_total) query.push(`pagination.count_total=${this.count_total}`)
        if(this.reverse) query.push(`pagination.reverse=${this.reverse}`)
        return query.join('&')
    }
    setPage(page: number) {
        if(page >= 1) this.offset = (page - 1) * this.limit
    }    
    setPageSize(size: number) {
        this.limit = size
    }
    
}

export interface PaginatedResponse {
    pagination: Pagination;
}

export class Response<T> {
    [key: string]: T
}

export interface Coin {
    amount: string;
    denom: string;
}

export interface CoinWithPrice extends Coin {
    value?: number;
    price?: number;
    change24h?: number    
}

export interface UptimeStatus {
    height: number;
    filled: boolean;
    signed: boolean;
}

export interface TokenBalance {
    address: string;
    amount: string | number;
}

export interface Capital {
    slashable_balance: TokenBalance[];
    non_slashable_capital?: string | number;
    [key: string]: unknown;
}

/**
 * Calculates the potential consensus power of a validator based on their capital.
 * This is a TypeScript implementation of the Go function PotentialConsensusPower.
 * 
 * @param capital The validator's capital
 * @param powerReduction The power reduction factor as a string
 * @returns The potential consensus power as a number
 */
export function PotentialConsensusPower(capital: Capital, powerReduction: string): number {
  // Early return if no slashable balance and no non-slashable capital
  if (
    (!capital.slashable_balance || capital.slashable_balance.length === 0) && 
    (!capital.non_slashable_capital || capital.non_slashable_capital === "0")
  ) {
    return 0;
  }

  // Sum of inverses := sum(1 / amount)
  let sumInverse = 0;
  let count = 0;

  // Process slashable balances
  if (capital.slashable_balance && capital.slashable_balance.length > 0) {
    for (const sb of capital.slashable_balance) {
      const amount = typeof sb.amount === 'string' ? parseFloat(sb.amount) : sb.amount;
      if (amount > 0) {
        // Invert the balance: 1 / sb.Amount
        sumInverse += 1 / amount;
        count++;
      }
    }
  }

  if (capital.non_slashable_capital) {
    const nonSlashableAmount = typeof capital.non_slashable_capital === 'string' 
      ? parseFloat(capital.non_slashable_capital) 
      : capital.non_slashable_capital;
    
    if (nonSlashableAmount > 0) {
      // Invert the balance: 1 / NonSlashableBalance
      sumInverse += 1 / nonSlashableAmount;
      count++;
    }
  }

  if (count === 0 || sumInverse === 0) {
    return 0;
  }

  // Harmonic mean := N / (sum of inverses)
  const harmonicMean = count / sumInverse;
  
  // Convert powerReduction to number
  const powerReductionNum = parseFloat(powerReduction);
  if (powerReductionNum === 0) {
    return 0;
  }

  // Calculate final result
  const result = harmonicMean / powerReductionNum;
  
  // Check for overflow (simplified in JS/TS as we don't have the same int64 constraints)
  if (!Number.isFinite(result)) {
    return result > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
  }

  return Math.floor(result); // Return as integer
}
