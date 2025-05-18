import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/role.enum';

export class TokenDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  constructor(accessToken: string, refreshToken: string, username: string, role: UserRole) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.username = username;
    this.role = role;
  }
}