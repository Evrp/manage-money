import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { PaymentMethod, TransactionType } from "@moneyflow/shared";

export class UpdateTransactionDto {
  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() slipImageUrl?: string;
  @IsOptional() @IsBoolean() isNextMonthCycle?: boolean;
  @IsOptional() @IsNumber() targetMonth?: number;
  @IsOptional() @IsNumber() targetYear?: number;
  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @ValidateIf((dto) => dto.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsMongoId()
  creditCardId?: string;
}
