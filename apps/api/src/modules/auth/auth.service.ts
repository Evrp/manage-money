import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import axios from "axios";
import { User } from "../../schemas/user.schema";
import { Category } from "../../schemas/category.schema";
import { DEFAULT_CATEGORIES } from "../../seeds/default-categories";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async validateLineToken(idToken: string) {
    try {
      const channelId = process.env.LINE_CHANNEL_ID;
      if (!channelId) {
        console.error(
          "LINE_CHANNEL_ID is not defined in environment variables",
        );
        throw new UnauthorizedException(
          "Server configuration error: missing LINE_CHANNEL_ID",
        );
      }

      const params = new URLSearchParams();
      params.append("id_token", idToken);
      params.append("client_id", channelId);

      const response = await axios.post(
        "https://api.line.me/oauth2/v2.1/verify",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { sub, name, picture, email } = response.data;
      if (!sub) {
        throw new UnauthorizedException("Invalid LINE token");
      }

      // Atomic find and update or create
      const user = await this.userModel.findOneAndUpdate(
        { lineUserId: sub },
        {
          $set: {
            displayName: name,
            pictureUrl: picture,
            email: email,
          },
          $setOnInsert: {
            financialScore: 50,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // Check if it was a new user by looking at categories
      const categoryCount = await this.categoryModel.countDocuments({
        userId: user._id,
      });
      if (categoryCount === 0) {
        // Initialize default categories for new user
        const categories = DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          userId: user._id,
        }));
        await this.categoryModel.insertMany(categories);
      }

      const payload = { sub: user._id, lineUserId: user.lineUserId };
      return {
        accessToken: this.jwtService.sign(payload),
        user,
      };
    } catch (error) {
      console.error(
        "LINE verification error:",
        (error as any).response?.data || (error as any).message,
      );
      throw new UnauthorizedException("Failed to verify LINE token");
    }
  }

  /**
   * Local-only login for an existing LINE user, without the LINE client or a
   * LIFF ID. The user ID is configured server-side and cannot be supplied by
   * the browser.
   */
  async loginDevelopmentUser() {
    if (process.env.NODE_ENV !== "development") {
      throw new UnauthorizedException("Development login is disabled");
    }

    const lineUserId = process.env.DEVELOPMENT_LINE_USER_ID;
    if (!lineUserId) {
      throw new UnauthorizedException("Development user is not configured");
    }

    const user = await this.userModel.findOne({ lineUserId });
    if (!user) {
      throw new UnauthorizedException("Development user was not found");
    }

    const payload = { sub: user._id, lineUserId: user.lineUserId };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
