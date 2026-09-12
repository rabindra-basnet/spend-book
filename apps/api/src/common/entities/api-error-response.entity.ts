import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetailsEntity {
  @ApiProperty({ example: 'bad_request' })
  code!: string;

  @ApiProperty({ example: 'Invalid request payload or parameters' })
  message!: string;

  @ApiPropertyOptional({ example: ['categories.0.categoryId must be a UUID'] })
  details?: unknown;
}

export class ApiErrorResponseEntity {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ErrorDetailsEntity })
  error!: ErrorDetailsEntity;
}
