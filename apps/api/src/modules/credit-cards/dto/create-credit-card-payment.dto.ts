import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

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

  @IsDateString()
  paidAt: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
