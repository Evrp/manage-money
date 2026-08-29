import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { CreditCardPaymentMode } from "@moneyflow/shared";

export class CreateCreditCardPaymentDto {
  @IsInt()
  @Min(1)
  @Max(12)
  statementMonth: number;

  @IsInt()
  @Min(2000)
  statementYear: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @IsEnum(CreditCardPaymentMode)
  mode: CreditCardPaymentMode;

  @IsDateString()
  paidAt: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
