import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import { User } from "../../schemas/user.schema";
import { Category } from "../../schemas/category.schema";
export declare class AuthService {
    private readonly jwtService;
    private userModel;
    private categoryModel;
    constructor(jwtService: JwtService, userModel: Model<User>, categoryModel: Model<Category>);
    validateLineToken(idToken: string): Promise<{
        accessToken: string;
        user: import("mongoose").Document<unknown, {}, User, {}, {}> & User & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
