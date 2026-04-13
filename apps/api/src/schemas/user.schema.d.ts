import { Document } from "mongoose";
import { Theme, IUser } from "@moneyflow/shared";
export declare class User extends Document implements IUser {
    lineUserId: string;
    displayName: string;
    pictureUrl: string;
    email?: string;
    theme: Theme;
    currency: string;
    monthlyBudget?: number;
    financialScore: number;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
