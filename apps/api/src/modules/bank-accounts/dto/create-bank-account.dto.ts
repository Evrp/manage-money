import {
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  bankName: string;

  @IsOptional()
  @Matches(/^\d{4}$/)
  last4?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
