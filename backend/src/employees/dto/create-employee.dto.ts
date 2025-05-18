import {
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsString()
  position: string;

  @IsOptional()
  @IsNumber()
  managerId?: number;
}