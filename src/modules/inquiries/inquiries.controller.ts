import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryResponseDto } from './dto/inquiry-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InquiryRateLimitGuard } from './guards/inquiry-rate-limit.guard';

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller({ path: 'inquiries', version: '1' })
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, InquiryRateLimitGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Anonymously submit a symptom inquiry to a specialist',
    description:
      'Authentication is required to call this endpoint, but the ' +
      "submitted inquiry is stored with no link back to the caller's " +
      'account — see PII protection notes on the Inquiry model.',
  })
  @ApiCreatedResponse({
    description: 'Inquiry submitted successfully.',
    type: InquiryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Token missing or expired.' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit reached (max 3 submissions per hour).',
  })
  async create(
    @Body() createInquiryDto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    return this.inquiriesService.submit(createInquiryDto);
  }
}
