import { ApiProperty } from '@nestjs/swagger';
import { UserProfileEntity } from './user-profile.entity.js';

export class AuthResponseEntity {
  @ApiProperty({ type: UserProfileEntity })
  user!: UserProfileEntity;

  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds' })
  accessTokenExpiresIn!: number;

  @ApiProperty()
  refreshToken!: string;
}