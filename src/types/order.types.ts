export type OrderStatus = 
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed';

export interface CreateOrderRequest {
  fromToken: string;
  toToken: string;
  amount: number;
}

export interface Order {
  orderId: string;
  fromToken: string;
  toToken: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  selectedDex?: string;
  outputAmount?: number;
  transactionHash?: string;
}

export interface DEXQuote {
  dex: string;
  output: number;
  price: number;
  fee: number;
}

export interface OrderJobData {
  orderId: string;
  fromToken: string;
  toToken: string;
  amount: number;
}

export interface OrderProgress {
  orderId: string;
  status: OrderStatus;
  progress: number;
  message?: string;
  data?: Partial<Order>;
}

