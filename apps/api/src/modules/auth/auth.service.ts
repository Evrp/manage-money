import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { User } from '../../schemas/user.schema';
import { Category } from '../../schemas/category.schema';
import { DEFAULT_CATEGORIES } from '../../seeds/default-categories';

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
      const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
        params: {
          id_token: idToken,
          client_id: channelId,
        },
      });

      const { sub, name, picture, email } = response.data;
      if (!sub) {
        throw new UnauthorizedException('Invalid LINE token');
      }

      let user = await this.userModel.findOne({ lineUserId: sub });

      if (!user) {
        // Create new user
        user = await this.userModel.create({
          lineUserId: sub,
          displayName: name,
          pictureUrl: picture,
          email: email,
          financialScore: 50, // Starting score
        });

        // Initialize default categories for new user
        const categories = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          userId: user._id,
        }));
        await this.categoryModel.insertMany(categories);
      } else {
        // Update existing user info
        user.displayName = name;
        user.pictureUrl = picture;
        await user.save();
      }

      const payload = { sub: user._id, lineUserId: user.lineUserId };
      return {
        accessToken: this.jwtService.sign(payload),
        user,
      };
    } catch (error) {
      console.error('LINE verification error:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to verify LINE token');
    }
  }
}
