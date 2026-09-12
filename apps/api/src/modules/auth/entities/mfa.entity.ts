import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupEntity {
  @ApiProperty({ description: 'Base32 TOTP secret to add to the authenticator app' })
  secret!: string;

  @ApiProperty({ description: 'otpauth:// URI (also encodable as a QR code)' })
  uri!: string;
}

export class BackupCodesEntity {
  @ApiProperty({ description: 'Single-use recovery codes shown exactly once', type: [String] })
  backupCodes!: string[];
}

export class PasskeyRegistrationResultEntity {
  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty()
  credentialId!: string;
}