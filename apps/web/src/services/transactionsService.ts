import api from "./api";

export interface TransactionsQueryParams {
  limit?: number;
  type?: string;
  month?: number;
  year?: number;
  dateFrom?: string;
  dateTo?: string;
  uploadDate?: string;
  slipsOnly?: boolean;
  sortByUpload?: boolean;
  order?: "asc" | "desc";
}

export interface TransactionIdParams {
  id: string;
}

export interface UpdateTransactionParams extends TransactionIdParams {
  payload: unknown;
}

export const getTransactions = async (params: TransactionsQueryParams) =>
  (await api.get("/transactions", { params })).data;
export const getRecentTransactions = async () => (await api.get("/transactions", { params: { limit: 5 } })).data;
export const createTransaction = (payload: unknown) => api.post("/transactions", payload);
export const updateTransaction = ({ id, payload }: UpdateTransactionParams) => api.patch(`/transactions/${id}`, payload);
export const deleteTransaction = ({ id }: TransactionIdParams) => api.delete(`/transactions/${id}`);
