import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class VerifyWebauthnRegistrationDto {
  @ApiProperty({
    description: 'RegistrationResponseJSON from startRegistration()',
  })
  @IsObject()
  @IsNotEmpty()
  response!: Record<string, unknown>;
}
