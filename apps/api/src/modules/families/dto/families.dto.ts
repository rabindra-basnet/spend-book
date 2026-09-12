import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address of the invitee',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Member role',
    example: 'member',
    default: 'member',
  })
  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateFamilySettingsDto {
  @ApiPropertyOptional({ description: 'Family name', example: 'Doe Family' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Default currency', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'US' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Locale', example: 'en-US' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
