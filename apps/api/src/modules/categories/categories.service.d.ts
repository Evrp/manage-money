import { Model } from "mongoose";
import { Category } from "../../schemas/category.schema";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
export declare class CategoriesService {
    private categoryModel;
    constructor(categoryModel: Model<Category>);
    findAll(userId: string): Promise<(import("mongoose").Document<unknown, {}, Category, {}, {}> & Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    create(userId: string, createCategoryDto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, Category, {}, {}> & Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, Category, {}, {}> & Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
