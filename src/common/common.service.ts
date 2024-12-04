import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginateDto } from './entity/base-paginate.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseModel } from './entity/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  paginate<T extends BaseModel>(
    dto: BasePaginateDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginateDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });

    return {
      data,
      total: count,
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginateDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    /**
     * where__likeCount__more_than
     *
     * where__title__ilike
     */

    const findOptions = this.composeFindOptions<T>(dto);

    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions,
    });

    // 해당되는 포스트가 0개 이상이면 마지막 포스트를 가져오고 아니면 null을 반환한다.
    const lastItem =
      results.length > 0 && results.length === dto.take ? results.at(-1) : null;

    const nextUrl =
      lastItem &&
      new URL(
        `${this.configService.get<string>('PROTOCOL')}://${this.configService.get<string>('HOST')}:${this.configService.get<string>('PORT')}/${path}`,
      );

    if (nextUrl) {
      /**
       * dto의 키값들을 루핑하면서 키값에 해당하는 밸류가 존재하면 param에 그대로 붙여넣는다.
       */
      for (const key of Object.keys(dto)) {
        // if (dto[key] || dto[key] === 0) {
        //   if (key === 'where__id_more_than') {
        //     nextUrl.searchParams.append(key, lastItem.id.toString());
        //   } else {
        //     nextUrl.searchParams.append(key, dto[key].toString());
        //   }
        // }

        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginateDto,
  ): FindManyOptions<T> {
    /**
     * where,
     * order,
     * take,
     * skip -> page 기반일 때만
     */
    /**
     * DTO의 현재 생긴 구조는 아래와 같다.
     *
     * {
     *  where__id__more_than: 1,
     *  order__createdAt: 'ASC
     * }
     *
     * where__likeCount__more_than, where__title__ilike 등 추가 필터를 넣고 싶어졌을 때
     * 모든 where 필터들을 자동으로 파싱할 수 있을만한 기능을 제작해야 한다.
     *
     * 1) where로 시작하면 필터 로직을 적용한다.
     * 2) order로 시작하면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__'로 split 했을 때 3개의 값으로 나뉘는지, 2개의 값으로 나뉘는지 확인한다.
     *  - 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용한다.
     *  ['where', 'id', 'more_than']
     *  - 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용한다.
     *  ['where', 'id']
     * 4) order의 경우 3-2와 같은 방식으로 적용한다.
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // key -> where__id__less_than
      // value -> 1

      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를 들어 where__id__more_than
     * __를 기준으로 나눴을 때
     *
     * ['where', 'id', 'more_than']
     */

    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을 때 길이가 2 또는 3이어야 합니다 - 문제되는 키 값: ${key}`,
      );
    }

    /**
     * 길이가 2일 경우는
     * where__id = 3
     *
     * FindOptinosWhere로 풀어보면 아래와 같다.
     *
     * {
     *  where: {
     *   id: 3}
     * }
     */

    if (split.length === 2) {
      // ['where', 'id']
      const [_, field] = split;

      /**
       * field -> 'id
       * value -> 3
       *
       * {
       *    id: 3
       * }
       */

      options[field] = value;
    } else {
      /**
       * 길이가 3일 경우는
       * TypeORM에서 제공하는 operator를 사용해야 한다.
       *
       * where__id__more_than의 경우
       * where는ㅁ 버려도 되고 두번째 값은 필터할 키값이 되고
       * 세번째는 typeorm operator가 된다.
       *
       * FILTER_MAPPER에서 미리 정의해둔 값들로
       * field 값에 FILTER_MAPPER에서 해당되는 utility를 가져온 후 값에 적용해준다.
       */

      const [_, field, operator] = split;

      // where__id_between = 3,4
      // 만약에 split 대상 문자가 존재하지 않으면 길이가 무조건 1이다.
      const values = value.toString().split(',');

      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}%`);
      } else {
        options[field] = FILTER_MAPPER[operator](...values);
      }
    }

    return options;
  }
}
