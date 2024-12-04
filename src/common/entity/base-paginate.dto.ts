import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginateDto {
  @IsNumber()
  @IsOptional()
  page?: number;
  // 이전 마지막 데이터의 ID
  // 이 프로퍼티의 입력된 ID보다 높은 ID를 가진 데이터를 가져온다.
  // @Type(() => Number) // Type을 Number로 변환한다.

  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 정렬
  // createdAt: 생성된 시간의 오름/내림차순으로 정렬
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order__createdAt?: 'ASC' | 'DESC' = 'ASC' as const;

  // 몇 개의 데이터를 응답으로 받을지
  @IsNumber()
  @IsOptional()
  take: number = 20;
}
