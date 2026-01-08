const ASAAS_API_URL = process.env.ASAAS_SANDBOX === 'true' 
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://www.asaas.com/api/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}

interface AsaasPaymentResponse {
  id: string;
  status: string;
  value: number;
  netValue: number;
  billingType: string;
  dueDate: string;
  invoiceUrl?: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}

interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  status: string;
  cycle: string;
}

async function asaasRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY not configured');
  }

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('ASAAS API Error:', error);
    throw new Error(`ASAAS API Error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function createCustomer(data: {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
  try {
    const response = await asaasRequest<{ data: AsaasCustomer[] }>(`/customers?email=${encodeURIComponent(email)}`);
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

export async function getOrCreateCustomer(data: {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  const existing = await getCustomerByEmail(data.email);
  if (existing) {
    return existing;
  }
  return createCustomer(data);
}

export async function createPayment(data: {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}): Promise<AsaasPaymentResponse> {
  return asaasRequest<AsaasPaymentResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPixQrCode(paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  return asaasRequest(`/payments/${paymentId}/pixQrCode`);
}

export async function getPaymentStatus(paymentId: string): Promise<{
  id: string;
  status: string;
  value: number;
  billingType: string;
}> {
  return asaasRequest(`/payments/${paymentId}`);
}

export async function createSubscription(data: {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  value: number;
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  nextDueDate: string;
  description?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
}): Promise<AsaasSubscriptionResponse> {
  return asaasRequest<AsaasSubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
  return asaasRequest(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}

export async function getSubscriptionPayments(subscriptionId: string): Promise<{
  data: AsaasPaymentResponse[];
}> {
  return asaasRequest(`/subscriptions/${subscriptionId}/payments`);
}

export function formatDateForAsaas(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isAsaasConfigured(): boolean {
  return !!ASAAS_API_KEY;
}
