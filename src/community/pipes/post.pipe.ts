import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isDefined, isEnum } from 'class-validator';
import { POST_FILTER } from 'src/helpers/enum/filter.enum';

export class PostFilterValidationPipe implements PipeTransform<string, Promise<POST_FILTER>> {
  transform(value: string): Promise<POST_FILTER> {
    if (isDefined(value) && isEnum(value, POST_FILTER)) {
      return POST_FILTER[value];
    } else {
      throw new BadRequestException(
        `Query parameter 'filter' is not value. Acceptable values are ${Object.keys(POST_FILTER)
          .map(key => POST_FILTER[key])
          .join(', ')}`
      );
    }
  }
}
