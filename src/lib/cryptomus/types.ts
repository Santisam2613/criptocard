export interface CryptomusPaymentPayload {
  amount: string;
  currency: string;
  order_id: string;
  url_callback?: string;
  url_return?: string;
  url_success?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
}

export interface CryptomusPaymentResponse {
  state: number;
  result: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_amount: string;
    payer_amount: string;
    payer_currency: string;
    currency: string;
    comments: string;
    status: string;
    is_final: boolean;
    url: string; // The payment page URL
    expired_at: number;
  };
}

export interface CryptomusWebhookPayload {
  type: string;
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount: string;
  payment_amount_usd: string;
  merchant_amount: string;
  commission: string;
  is_final: boolean;
  status: string; // "paid", "paid_over", "wrong_amount", "process", "confirm_check", "wrong_amount_waiting", "check", "fail", "cancel", "system_fail", "refund_process", "refund_fail", "refund_paid"
  from: string;
  wallet_address_layer: string;
  currency: string;
  payer_currency: string;
  additional_data?: string;
  convert?: {
    to_currency: string;
    commission: string;
    rate: string;
    amount: string;
  };
  txid?: string;
}
