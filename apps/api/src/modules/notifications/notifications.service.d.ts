import { Model } from "mongoose";
import { User } from "../../schemas/user.schema";
import { Budget } from "../../schemas/budget.schema";
export declare class NotificationsService {
    private userModel;
    private budgetModel;
    constructor(userModel: Model<User>, budgetModel: Model<Budget>);
    sendLineMessage(to: string, messages: any[]): Promise<void>;
    checkBudgetAlerts(userId: string, categoryId: string, month: number, year: number): Promise<void>;
    private sendBudgetAlert;
}
