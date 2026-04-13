import { DashboardService } from "./dashboard.service";
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(req: any, month: number, year: number): Promise<{
        totalIncome: any;
        totalExpense: any;
        netSaving: number;
        savingRate: number;
        topCategories: any[];
    }>;
    getMonthlyChart(req: any, year: number): Promise<{
        month: number;
        income: number;
        expense: number;
    }[]>;
    getCategoryBreakdown(req: any, month: number, year: number): Promise<any[]>;
}
