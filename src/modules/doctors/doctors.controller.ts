import {
  Controller,
  Get,
  Query,
  // ,UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { FindDoctorsDto } from './dto/find-doctors.dto';
import { FindDoctorsResponseDto } from './dto/doctor-response.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Doctors')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get filtered, sorted, and paginated list of doctors',
  })
  @ApiOkResponse({
    description: 'Doctors list resolved',
    type: FindDoctorsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Query parameter type mismatch' })
  @ApiUnauthorizedResponse({ description: 'Token missing or invalid' })
  findAll(@Query() query: FindDoctorsDto) {
    return this.doctorsService.findAll(query);
  }
}
