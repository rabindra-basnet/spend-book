import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const OTP_USAGES = ['totp', 'recovery_code'] as const;
export type OtpUsage = (typeof OTP_USAGES)[number];

export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password!: string;

  @ApiPropertyOptional({
    description: 'TOTP code or recovery code when the account has MFA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  otpCode?: string;

  @ApiPropertyOptional({ enum: OTP_USAGES, default: 'totp' })
  @IsOptional()
  @IsIn(OTP_USAGES, { message: 'usage must be "totp" or "recovery_code"' })
  usage?: OtpUsage;
}
