import {
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateCreditCardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  issuer: string;

  @IsString()
  @Matches(/^\d{4}$/)
  last4: string;

  @IsNumber()
  @Min(0)
  creditLimit: number;

  @IsInt()
  @Min(1)
  @Max(31)
  statementClosingDay: number;

  @IsInt()
  @Min(1)
  @Max(31)
  paymentDueDay: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  annualInterestRate: number = 25;

  @IsHexColor()
  color: string = "#1A1F36";
}
