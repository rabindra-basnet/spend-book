/**
 * Shared value-object utility for multi-currency money representation and conversion helpers.
 */
export interface MoneyAmount {
  amount: number; // Stored in minor currency units (or decimal number)
  currency: string; // ISO 4217 code (e.g. USD, EUR, NPR)
}

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD',
  ) {}

  static fromDecimal(amount: number, currency = 'USD'): Money {
    return new Money(Math.round(amount * 100) / 100, currency.toUpperCase());
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    return new Money(
      Math.round((this.amount + other.amount) * 100) / 100,
      this.currency,
    );
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot subtract different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    return new Money(
      Math.round((this.amount - other.amount) * 100) / 100,
      this.currency,
    );
  }

  toJSON(): MoneyAmount {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}
