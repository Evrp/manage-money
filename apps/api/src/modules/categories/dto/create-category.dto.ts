import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { CategoryType } from "@moneyflow/shared";

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(CategoryType)
  type: CategoryType;

  @IsNotEmpty()
  @IsString()
  icon: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;
}
