import { IsDateString } from "class-validator";

export class UpdateStatementDto {
  @IsDateString()
  dueDate: string;
}
