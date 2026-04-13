import { BudgetsService } from "./budgets.service";
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    findByMonth(req: any, month: number, year: number): Promise<Omit<import("mongoose").Document<unknown, {}, import("../../schemas/budget.schema").Budget, {}, {}> & import("../../schemas/budget.schema").Budget & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>[]>;
    updateLimit(req: any, categoryId: string, month: number, year: number, limitAmount: number): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/budget.schema").Budget, {}, {}> & import("../../schemas/budget.schema").Budget & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
