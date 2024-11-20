import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';

// Pick, Omit, Partial
// PickType, OmitType, PartialType

export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {}
