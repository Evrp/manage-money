import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
