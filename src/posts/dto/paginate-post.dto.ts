import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BasePaginateDto } from 'src/common/entity/base-paginate.dto';

export class PaginatePostDto extends BasePaginateDto {
  @IsNumber()
  @IsOptional()
  where__likeCount__more_than?: number;

  @IsString()
  @IsOptional()
  where__title__i_like?: string;
}
