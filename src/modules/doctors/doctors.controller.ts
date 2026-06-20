import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  // ,UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { FindDoctorsDto } from './dto/find-doctors.dto';
import { FindDoctorsResponseDto } from './dto/doctor-response.dto';
import { type AuthRequest } from '../../common/types/request.type';
import { AppendHistoryDto } from './dto/append-history.dto';
import { AutocompleteResponseDto } from './dto/auto-complete-response.dto';
import { RecentSearchResponseDto } from './dto/recent-search-response.dto';
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

  @Get('autocomplete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Live search suggestion provider (Autocomplete)' })
  @ApiQuery({
    name: 'q',
    type: String,
    required: true,
    description: 'The typed search query (Minimum 3 characters required)',
  })
  @ApiOkResponse({
    description: 'Auto-complete list resolved successfully.',
    type: AutocompleteResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token missing or expired.' })
  async autocomplete(@Query('q') query: string) {
    return this.doctorsService.autocomplete(query);
  }

  // 2. Retrieve active user search history
  @Get('recent-searches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve authenticated user search history (Last 5 searches)',
  })
  @ApiOkResponse({
    description: 'Active user search history retrieved successfully.',
    type: [RecentSearchResponseDto], // مصفوفة من الـ Recent Searches
  })
  @ApiUnauthorizedResponse({ description: 'Token missing or expired.' })
  async getRecentSearches(@Req() req: AuthRequest) {
    const userId = req.user.userId;
    return this.doctorsService.getRecentSearches(userId);
  }

  // 3. Delete past search history node
  @Delete('recent-searches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a specific past search history node securely',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The UUID of the specific search history item to delete',
  })
  @ApiOkResponse({
    description: 'History node deleted successfully or history updated.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Token missing, expired, or item does not belong to the authenticated user.',
  })
  async deleteRecentSearch(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user.userId;
    return this.doctorsService.deleteRecentSearch(userId, id);
  }

  // 4. Automatically append successfully clicked searches to the user's history log
  @Post('recent-searches')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Automatically append successfully clicked searches to the user's history log",
  })
  @ApiOkResponse({
    description: 'Search interaction successfully logged and history updated.',
  })
  @ApiUnauthorizedResponse({ description: 'Token missing or expired.' })
  async appendToHistory(
    @Req() req: AuthRequest,
    @Body() body: AppendHistoryDto,
  ) {
    const userId = req.user.userId;
    return this.doctorsService.appendToHistory(userId, body);
  }
}
