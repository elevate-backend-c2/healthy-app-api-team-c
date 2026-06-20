import { ApiProperty } from '@nestjs/swagger';
import { SuggestionItemDto } from './suggestion-item.dto';

export class AutocompleteResponseDto {
  @ApiProperty({ type: [SuggestionItemDto] })
  suggestions: SuggestionItemDto[];
}
