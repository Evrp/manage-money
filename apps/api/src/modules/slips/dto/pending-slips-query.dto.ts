import { IsDateString, IsIn, IsOptional } from "class-validator";

export class PendingSlipsQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsIn(["newest", "oldest"])
  sort?: "newest" | "oldest";
}
