import { AuthService } from "./auth.service";
import { LineLoginDto } from "./dto/line-login.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(lineLoginDto: LineLoginDto): Promise<{
        accessToken: string;
        user: import("mongoose").Document<unknown, {}, import("../../schemas/user.schema").User, {}, {}> & import("../../schemas/user.schema").User & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
