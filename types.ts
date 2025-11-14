export interface TransactionItem {
  tempId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
}

// Gemini response types
export interface GeminiSaleEntry {
  type: 'sale_entry';
  data: {
    date: string; // "YYYY-MM-DD"
    itemName: string;
    quantity: number;
    unitPrice: number;
  };
}

export interface GeminiSummaryRequest {
  type: 'summary_request';
  data: {
    period: 'daily' | 'monthly';
  };
}

export interface GeminiMessage {
  type: 'message' | 'error';
  data: {
    text: string;
  };
}

export type GeminiResponse = GeminiSaleEntry | GeminiSummaryRequest | GeminiMessage;
