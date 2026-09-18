import api from "./api";

export type AnalyticsBasis = "budget" | "transaction";

export interface DashboardPeriodParams {
  month: number;
  year: number;
  basis?: AnalyticsBasis;
}

export interface MonthlyChartParams {
  year: number;
  basis?: AnalyticsBasis;
}

export interface CategoryChartParams extends DashboardPeriodParams {
  type: "income" | "expense";
}

export const getDashboardSummary = async (params: DashboardPeriodParams) =>
  (await api.get("/dashboard/summary", { params })).data;
export const getMonthlyChart = async (params: MonthlyChartParams) =>
  (await api.get("/dashboard/chart/monthly", { params })).data;
export const getCategoryChart = async (params: CategoryChartParams) =>
  (await api.get("/dashboard/chart/category", { params })).data;
