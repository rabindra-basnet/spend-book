import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import type {} from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ImportsService } from './imports.service.js';
import {
  CreateImportDto,
  UploadChunkDto,
  ConfigureImportDto,
  ImportQueryDto,
} from './dto/import.dto.js';
import {
  ImportEntity,
  ImportSessionEntity,
  ImportPreviewEntity,
} from './entities/import.entity.js';
import { CurrentFamily } from '../../common/decorators/current-family.decorator.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get()
  @ApiOperation({ summary: 'List imports for the family' })
  @ApiOkResponse({ type: [ImportEntity] })
  listImports(
    @CurrentFamily() familyId: string,
    @Query() query: ImportQueryDto,
  ) {
    return this.importsService.listImports(familyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import by ID' })
  @ApiOkResponse({ type: ImportEntity })
  getImport(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
  ) {
    return this.importsService.getImport(id, familyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new import' })
  @ApiCreatedResponse({ type: ImportEntity })
  createImport(
    @CurrentFamily() familyId: string,
    @Body() dto: CreateImportDto,
  ) {
    return this.importsService.createImport(familyId, dto);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload CSV file to an import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file to upload' },
      },
    },
  })
  @ApiOkResponse({ type: ImportEntity })
  async uploadContent(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    return this.importsService.uploadContent(id, familyId, content, file.originalname);
  }

  @Put(':id/configure')
  @ApiOperation({ summary: 'Configure import column mappings' })
  @ApiOkResponse({ type: ImportEntity })
  configureImport(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Body() dto: ConfigureImportDto,
  ) {
    return this.importsService.configureImport(id, familyId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish import for processing' })
  @ApiOkResponse({ type: ImportEntity })
  publishImport(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
  ) {
    return this.importsService.publishImport(id, familyId);
  }

  @Get(':id/rows')
  @ApiOperation({ summary: 'Get import rows' })
  getImportRows(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.importsService.getImportRows(id, familyId, page, perPage);
  }

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview CSV content before import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file to preview' },
      },
    },
  })
  @ApiOkResponse({ type: ImportPreviewEntity })
  async previewContent(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    return this.importsService.previewContent(content);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a chunked import session' })
  @ApiCreatedResponse({ type: ImportSessionEntity })
  createSession(
    @CurrentFamily() familyId: string,
    @Body() body: { importType: string; clientSessionId?: string; expectedChunks?: number },
  ) {
    return this.importsService.createImportSession(
      familyId,
      body.importType,
      body.clientSessionId,
      body.expectedChunks,
    );
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get import session by ID' })
  @ApiOkResponse({ type: ImportSessionEntity })
  getSession(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
  ) {
    return this.importsService.getImportSession(id, familyId);
  }

  @Post('sessions/:id/chunks')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a chunk to an import session' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV chunk to upload' },
        sequence: { type: 'number', description: 'Chunk sequence number' },
        clientChunkId: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: ImportSessionEntity })
  async uploadChunk(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('sequence') sequence: number,
    @Body('clientChunkId') clientChunkId?: string,
  ) {
    const dto: UploadChunkDto = {
      sequence,
      clientChunkId,
      content: file.buffer.toString('utf-8'),
      filename: file.originalname,
    };

    return this.importsService.uploadChunk(id, familyId, dto);
  }

  @Post('sessions/:id/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Publish import session for processing' })
  @ApiOkResponse({ type: ImportSessionEntity })
  publishSession(
    @CurrentFamily() familyId: string,
    @Param('id') id: string,
  ) {
    return this.importsService.publishSession(id, familyId);
  }
}
