import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PostsService } from './posts.service';

/**
 * @Controller('posts')
 * 첫번째 파라메터로 지정한 post는 URL prefix 경로를 의미한다.
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * @Get()
   * 첫번째 파라메터로 지정한 post는 Controller URL prefix 기준으로 상대적인 경로를 의미한다.
   * 파라메터가 없는 경우 현재 URL prefix의 root 경로를 의미한다.
   */

  @Get()
  getPosts() {
    return this.postsService.getAllPosts();
  }

  // GET /posts/:id
  // @Param() 데코레이터를 통해서 받아올 수 있다.
  // @Param('id') 매개변수를 통해 어떤 파라메터를 가져올지 지정할 수 있다.
  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postsService.getPostById(+id);
  }

  // POST /posts
  // @Body() 데코레이터를 통해서 데이터를 받아올 수 있다.
  // @Body('author') 데코레이터를 통해서 받고자 하는 데이터의 키를 지정할 수 있다.
  @Post()
  postPosts(
    @Body('authorId') authorId: number,
    @Body('title') title: string,
    @Body('content') content: string,
  ) {
    return this.postsService.createPost(authorId, title, content);
  }

  @Patch(':id')
  patchPost(
    @Param('id') id: string,
    @Body('title') title?: string,
    @Body('content') content?: string,
  ) {
    return this.postsService.updatePost(+id, title, content);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(+id);
  }
}
