import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { OtpUsage } from './login.dto.js';

export class DisableMfaDto {
  @ApiProperty({ description: 'TOTP code or recovery code to authorize the change' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;

  @ApiPropertyOptional({ enum: ['totp', 'recovery_code'], default: 'totp' })
  @IsOptional()
  @IsIn(['totp', 'recovery_code'], { message: 'usage must be "totp" or "recovery_code"' })
  usage?: OtpUsage;
}