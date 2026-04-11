import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsMongoId } from 'class-validator';
import { TransactionType } from '@moneyflow/shared';

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
}
