import api from "./api";

export interface BudgetPeriodParams {
  month: number;
  year: number;
}

export interface UpdateBudgetLimitPayload extends BudgetPeriodParams {
  categoryId: string;
  limitAmount: number;
}

export const getBudgets = async (params: BudgetPeriodParams) =>
  (await api.get("/budgets", { params })).data;
export const updateBudgetLimit = (payload: UpdateBudgetLimitPayload) =>
  api.put("/budgets/limit", payload);
