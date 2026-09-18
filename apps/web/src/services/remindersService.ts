import api from "./api";

export interface RecurringExpensePayload {
  name?: string;
  amount?: number;
  dueDay?: number;
  categoryId?: string;
  enabled?: boolean;
}

export interface UpdateRecurringExpenseParams {
  id: string;
  payload: RecurringExpensePayload;
}

export const getRecurringExpenses = async () => (await api.get("/recurring-expenses")).data;
export const createRecurringExpense = (payload: RecurringExpensePayload) => api.post("/recurring-expenses", payload);
export const updateRecurringExpense = ({ id, payload }: UpdateRecurringExpenseParams) => api.patch(`/recurring-expenses/${id}`, payload);
