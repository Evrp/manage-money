import { IsNotEmpty, IsString } from 'class-validator';

export class LineLoginDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
