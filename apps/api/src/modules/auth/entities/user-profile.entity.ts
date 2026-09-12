import { ApiProperty } from '@nestjs/swagger';

export class UserProfileEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: 'member' })
  role!: string;

  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  otpRequired!: boolean;

  @ApiProperty({ nullable: true })
  onboardedAt!: Date | null;
}