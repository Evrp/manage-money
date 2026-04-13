import { CategoryType } from "@moneyflow/shared";
export declare class CreateCategoryDto {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    monthlyLimit?: number;
}
