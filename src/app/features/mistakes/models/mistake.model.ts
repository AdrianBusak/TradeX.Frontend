export interface Mistake {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface CreateMistakeRequest {
  name: string;
  description?: string | null;
}

export interface UpdateMistakeRequest extends CreateMistakeRequest {}

export interface GetTradeMistakesResponse {
  tradeId: string;
  totalMistakes: number;
  mistakes: TradeMistakeItem[];
}

export interface TradeMistakeItem {
  mistakeId: string;
  name: string;
  description?: string | null;
  note?: string | null;
}

export interface UpdateTradeMistakesRequest {
  mistakes: UpdateTradeMistakeItemRequest[];
}

export interface UpdateTradeMistakeItemRequest {
  mistakeId: string;
  note?: string | null;
}
