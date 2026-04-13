import { Document, Types } from "mongoose";
import { CategoryType, ICategory } from "@moneyflow/shared";
export declare class Category extends Document implements ICategory {
    userId: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    monthlyLimit?: number;
    isDefault: boolean;
    isActive: boolean;
}
export declare const CategorySchema: import("mongoose").Schema<Category, import("mongoose").Model<Category, any, any, any, Document<unknown, any, Category, any, {}> & Category & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Category, Document<unknown, {}, import("mongoose").FlatRecord<Category>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Category> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
