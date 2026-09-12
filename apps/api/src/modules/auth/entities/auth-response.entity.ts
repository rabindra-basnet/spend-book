import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseEntity {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Access token lifetime in seconds' })
  accessTokenExpiresIn!: number;

  @ApiProperty()
  refreshToken!: string;
}

export class RegisterResponseEntity {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'User registered successfully' })
  message!: string;
}
