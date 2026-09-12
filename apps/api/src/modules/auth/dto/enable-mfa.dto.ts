import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({ description: 'Six digit TOTP code from the authenticator app' })
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'code must be a 6 digit TOTP code' })
  code!: string;
}