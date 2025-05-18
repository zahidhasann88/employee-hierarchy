import {
    IsString,
    IsOptional,
    IsNumber,
  } from 'class-validator';
  
export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsString()
    position?: string;
  
    @IsOptional()
    @IsNumber()
    managerId?: number;
  }
  