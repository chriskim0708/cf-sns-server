import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { UsersModel } from 'src/users/entities/users.entity';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
//import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';

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
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  // POST /posts
  // @Body() 데코레이터를 통해서 데이터를 받아올 수 있다.
  // @Body('author') 데코레이터를 통해서 받고자 하는 데이터의 키를 지정할 수 있다.
  @Post()
  @UseGuards(AccessTokenGuard)
  postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    // @Body('isPublic', new DefaultValuePipe(true)) isPublic: boolean,
    // 가드를 정상적으로 통과했다면 반드시 있음
  ) {
    return this.postsService.createPost(userId, body);
  }

  @Patch(':id')
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
