import { ApiProperty } from '@nestjs/swagger';
import { EmployeeResponseDto } from './employee-response.dto';

export class HierarchicalEmployeeDto extends EmployeeResponseDto {
  @ApiProperty({ type: [HierarchicalEmployeeDto], required: false })
  subordinates?: HierarchicalEmployeeDto[];

  @ApiProperty({
    description: 'Total number of subordinates (direct and indirect)',
    type: Number,
  })
  totalSubordinatesCount?: number;

  constructor(employee: any, subordinates: HierarchicalEmployeeDto[] = []) {
    super(employee);
    this.subordinates = subordinates;
  }
}
