import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: string;

  @ApiProperty({ required: false })
  managerId?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(employee: any) {
    this.id = employee.id;
    this.name = employee.name;
    this.position = employee.position;
    this.managerId = employee.managerId;
    this.createdAt = employee.createdAt;
    this.updatedAt = employee.updatedAt;
  }
}