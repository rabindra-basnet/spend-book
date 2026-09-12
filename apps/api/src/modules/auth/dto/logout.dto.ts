import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ description: 'The refresh token being signed out' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
