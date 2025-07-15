import { storage } from "../storage";

export class NOWPaymentsService {
  private apiKey: string | null = null;
  private apiUrl = "https://api.nowpayments.io/v1";

  constructor() {
    this.loadConfig();
  }

  private async loadConfig() {
    const config = await storage.getNowPaymentsConfig();
    if (config) {
      this.apiKey = config.apiKey;
    }
  }

  async getAvailableCurrencies() {
    if (!this.apiKey) throw new Error("NOWPayments not configured");
    
    const response = await fetch(`${this.apiUrl}/currencies`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch currencies');
    }
    
    return response.json();
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string = 'USD') {
    if (!this.apiKey) throw new Error("NOWPayments not configured");
    
    const response = await fetch(`${this.apiUrl}/exchange-amount/${fromCurrency}-${toCurrency}?amount=1`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get exchange rate');
    }
    
    return response.json();
  }

  async createPayment(amount: number, currency: string, orderId: string) {
    if (!this.apiKey) throw new Error("NOWPayments not configured");
    
    const response = await fetch(`${this.apiUrl}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'USD',
        pay_currency: currency,
        order_id: orderId,
        order_description: 'Casino Royal Aviator Deposit'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment');
    }
    
    return response.json();
  }

  async createPayout(address: string, amount: number, currency: string) {
    if (!this.apiKey) throw new Error("NOWPayments not configured");
    
    const response = await fetch(`${this.apiUrl}/payout`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address,
        amount,
        currency
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payout');
    }
    
    return response.json();
  }

  async testConnection() {
    if (!this.apiKey) throw new Error("NOWPayments not configured");
    
    const response = await fetch(`${this.apiUrl}/status`, {
      headers: {
        'x-api-key': this.apiKey
      }
    });
    
    return response.ok;
  }
}

export const nowPaymentsService = new NOWPaymentsService();
