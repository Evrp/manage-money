import { Document, Types } from "mongoose";
import { IBudget } from "@moneyflow/shared";
export declare class Budget extends Document implements IBudget {
    userId: string;
    categoryId: string;
    month: number;
    year: number;
    limitAmount: number;
    spentAmount: number;
    alertSent80: boolean;
    alertSent90: boolean;
}
export declare const BudgetSchema: import("mongoose").Schema<Budget, import("mongoose").Model<Budget, any, any, any, Document<unknown, any, Budget, any, {}> & Budget & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Budget, Document<unknown, {}, import("mongoose").FlatRecord<Budget>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Budget> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
