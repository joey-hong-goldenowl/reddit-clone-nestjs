import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isDefined, isEnum } from 'class-validator';
import { NEWS_FEED_FILTER } from 'src/helpers/enum/filter.enum';

export class NewsFeedFilterValidationPipe implements PipeTransform<string, Promise<NEWS_FEED_FILTER>> {
  transform(value: string): Promise<NEWS_FEED_FILTER> {
    if (isDefined(value) && isEnum(value, NEWS_FEED_FILTER)) {
      return NEWS_FEED_FILTER[value];
    } else {
      throw new BadRequestException(
        `Query parameter 'filter' is not value. Acceptable values are ${Object.keys(NEWS_FEED_FILTER)
          .map(key => NEWS_FEED_FILTER[key])
          .join(', ')}`
      );
    }
  }
}
