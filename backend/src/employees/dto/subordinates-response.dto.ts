import { ApiProperty } from '@nestjs/swagger';
import { HierarchicalEmployeeDto } from './hierarchical-employee.dto';

export class SubordinatesResponseDto {
  @ApiProperty({ type: HierarchicalEmployeeDto })
  employee: HierarchicalEmployeeDto;

  @ApiProperty({
    required: false,
  })
  message?: string;

  constructor(employee: HierarchicalEmployeeDto, message?: string) {
    this.employee = employee;
    this.message = message;
  }
}
