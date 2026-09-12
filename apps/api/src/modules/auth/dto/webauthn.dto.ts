import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export class PasskeyLoginOptionsDto {
  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}

export class PasskeyLoginVerifyDto {
  @ApiProperty({ description: 'AuthenticationResponseJSON from startAuthentication()' })
  response!: unknown;
}