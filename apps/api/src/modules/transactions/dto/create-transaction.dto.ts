import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  ValidateIf,
} from "class-validator";
import { PaymentMethod, TransactionType } from "@moneyflow/shared";

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  slipImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isNextMonthCycle?: boolean;

  @IsOptional()
  @IsNumber()
  targetMonth?: number;

  @IsOptional()
  @IsNumber()
  targetYear?: number;

  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @ValidateIf((dto) => dto.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsNotEmpty() @IsMongoId() creditCardId?: string;
}
