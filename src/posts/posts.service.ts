import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import {
  POST_IMAGE_PATH,
  PUBLIC_FOLDER_PATH,
  TEMP_FOLDER_PATH,
} from 'src/common/const/path.const';
import { basename, join } from 'path';
import { promises } from 'fs';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  // repository 접근은 비동기이기 때문에 async 키워드를 사용한다.
  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의뢰 생성된 포스트 제목 ${i}`,
        content: `임의로 생성된 포스트 내용 ${i}`,
      });
    }
  }

  // async cursorPaginatePosts(dto: PaginatePostDto) {
  //   const where: FindOptionsWhere<PostsModel> = {};

  //   if (dto.order__createdAt === 'ASC') {
  //     where.id = MoreThan(dto.where__id__cursor);
  //   } else {
  //     where.id = LessThan(dto.where__id__cursor);
  //   }

  //   const posts = await this.postsRepository.find({
  //     where,
  //     // order__createdAt: 'ASC' -> 생성된 시간의 오름차순으로 정렬
  //     order: {
  //       createdAt: dto.order__createdAt,
  //     },
  //     take: dto.take,
  //   });

  //   /**
  //    * Response
  //    *
  //    * data: Data[],
  //    * cursor: {
  //    *  after: 마지막 Data의 ID
  //    * },
  //    * count: 응답한 데이터의 갯수,
  //    * next: 다음 요청을 할 때 사용할 URL
  //    */

  //   // 해당되는 포스트가 0개 이상이면 마지막 포스트를 가져오고 아니면 null을 반환한다.
  //   const lastItem =
  //     posts.length > 0 && posts.length === dto.take ? posts.at(-1) : null;

  //   const nextUrl = lastItem && new URL(`${PROTOCOL}://${HOST}:${PORT}/posts`);

  //   if (nextUrl) {
  //     /**
  //      * dto의 키값들을 루핑하면서 키값에 해당하는 밸류가 존재하면 param에 그대로 붙여넣는다.
  //      */
  //     for (const key of Object.keys(dto)) {
  //       if (dto[key] || dto[key] === 0) {
  //         if (key === 'where__id_cursor') {
  //           nextUrl.searchParams.append(key, lastItem.id.toString());
  //         } else {
  //           nextUrl.searchParams.append(key, dto[key].toString());
  //         }
  //       }
  //     }
  //   }

  //   return {
  //     data: posts,
  //     cursor: {
  //       after: lastItem?.id ?? null,
  //     },
  //     count: posts.length,
  //     next: nextUrl?.toString(),
  //   };
  // }

  async pagePaginatePosts(dto: PaginatePostDto) {
    /**
     * data: Data[],
     * total: number;
     */

    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      take: dto.take,
      order: {
        createdAt: dto.order__createdAt,
      },
    });

    return {
      data: posts,
      total: count,
    };
  }

  // 오름차순으로 정렬하는 pagination만 구현한다.
  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate<PostsModel>(
      dto,
      this.postsRepository,
      {
        relations: ['author'],
      },
      'posts',
    );
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      relations: ['author'],
      where: { id },
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  async createPostImage(dto: CreatePostDto) {
    // dto의 이미지 이름을 기반으로 파일의 경로를 생성한다.

    const tempFilePath = join(TEMP_FOLDER_PATH, dto.image);

    try {
      // 파일이 존재하는지 확인
      // 만약에 존재하지 않으면 에러를 던짐
      await promises.access(tempFilePath);
    } catch (e) {
      throw new BadRequestException('존재하지 않는 파일입니다.');
    }

    // 파일의 이름만 가져오기
    // temp/xxx.png -> xxx.png
    const fileName = basename(tempFilePath);

    // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
    // {프로젝트 경로}/public/posts/xxx.png
    const newFilePath = join(POST_IMAGE_PATH, fileName);

    // 파일 옮기기
    await promises.rename(tempFilePath, newFilePath);

    return true;
  }

  async createPost(authorId: number, postDto: CreatePostDto) {
    // 1. create -> 저장할 객체를 생성한다.
    // 2. save -> 객체를 저장한다. (create에서 생성한 객체를 저장한다.)

    const post = this.postsRepository.create({
      author: { id: authorId },
      ...postDto,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    // save의 기능
    // 1. 만약에 데이터가 존재하지 않는다면 새로운 데이터를 생성한다. (id 기준)
    // 2. 만약에 데이터가 존재한다면 데이터를 업데이트한다. (id 기준)

    const findPost = await this.postsRepository.findOne({ where: { id } });

    if (!findPost) {
      throw new NotFoundException();
    }

    const post = this.postsRepository.create({
      id,
      ...postDto,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete({ id });

    return id;
  }
}
