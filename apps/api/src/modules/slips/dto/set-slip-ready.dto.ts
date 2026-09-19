import { IsBoolean } from "class-validator";

export class SetSlipReadyDto {
  @IsBoolean()
  readyForSave: boolean;
}
