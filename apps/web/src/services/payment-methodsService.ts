import api from "./api";

export interface CreditCard {
  _id: string;
  name: string;
  issuer: string;
  last4: string;
  creditLimit: number;
  statementClosingDay: number;
  paymentDueDay: number;
  annualInterestRate: number;
  color: string;
  isActive: boolean;
}

export interface BankAccount {
  _id: string;
  name: string;
  bankName: string;
  last4?: string;
  color?: string;
}

export interface CreateCreditCardPayload extends Omit<CreditCard, "_id" | "isActive"> {}
export interface UpdateCreditCardPayload extends Partial<CreditCard> {
  id: string;
}
export interface CreateBankAccountPayload extends Pick<BankAccount, "name" | "bankName" | "last4"> {}
export interface CreditCardStatementParams {
  id: string;
  month: number;
  year: number;
}
export interface RecordCreditCardPaymentParams {
  id: string;
  payload: unknown;
}
export interface UpdateCreditCardStatementDueDateParams extends CreditCardStatementParams {
  dueDate: string;
}

export const getCreditCards = async () => {
  const { data } = await api.get<CreditCard[] | { data: CreditCard[] }>("/credit-cards");
  return Array.isArray(data) ? data : data.data || [];
};
export const createCreditCard = async (payload: CreateCreditCardPayload) =>
  (await api.post<CreditCard>("/credit-cards", payload)).data;
export const updateCreditCard = async ({ id, ...payload }: UpdateCreditCardPayload) =>
  (await api.patch<CreditCard>(`/credit-cards/${id}`, payload)).data;
export const getBankAccounts = async () => {
  const { data } = await api.get<BankAccount[] | { data: BankAccount[] }>("/bank-accounts");
  return Array.isArray(data) ? data : data.data || [];
};
export const createBankAccount = async (payload: CreateBankAccountPayload) =>
  (await api.post<BankAccount>("/bank-accounts", payload)).data;
export const getCreditCardStatement = async ({ id, month, year }: CreditCardStatementParams) =>
  (await api.get(`/credit-cards/${id}/statements`, { params: { month, year } })).data;
export const recordCreditCardPayment = ({ id, payload }: RecordCreditCardPaymentParams) => api.post(`/credit-cards/${id}/payments`, payload);
export const updateCreditCardStatementDueDate = ({ id, year, month, dueDate }: UpdateCreditCardStatementDueDateParams) =>
  api.put(`/credit-cards/${id}/statements/${year}/${month}`, { dueDate });
