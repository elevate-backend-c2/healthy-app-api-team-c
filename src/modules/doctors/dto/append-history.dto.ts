import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class AppendHistoryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['doctor', 'specialty'])
  type: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
