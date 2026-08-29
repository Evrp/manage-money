import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Category } from "../../schemas/category.schema";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async onModuleInit() {
    // Mongoose does not remove indexes that were created by an older schema.
    // Drop the former unique index so existing deployments accept the new rule.
    try {
      await this.categoryModel.collection.dropIndex("userId_1_name_1");
    } catch (error: any) {
      // MongoDB returns IndexNotFound when this migration has already run.
      if (error?.codeName !== "IndexNotFound" && error?.code !== 27) {
        throw error;
      }
    }

    await this.categoryModel.createIndexes();
  }

  async findAll(userId: string) {
    return this.categoryModel
      .find({ userId, isActive: true })
      .sort({ name: 1 });
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const createdCategory = new this.categoryModel({
      ...createCategoryDto,
      userId,
    });
    return createdCategory.save();
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateCategoryDto },
      { new: true },
    );
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  async remove(userId: string, id: string) {
    // Soft delete
    const category = await this.categoryModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isActive: false } },
      { new: true },
    );
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return { success: true };
  }
}
