import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(req: any): Promise<(import("mongoose").Document<unknown, {}, import("../../schemas/category.schema").Category, {}, {}> & import("../../schemas/category.schema").Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    create(req: any, createCategoryDto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/category.schema").Category, {}, {}> & import("../../schemas/category.schema").Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(req: any, id: string, updateCategoryDto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../../schemas/category.schema").Category, {}, {}> & import("../../schemas/category.schema").Category & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
