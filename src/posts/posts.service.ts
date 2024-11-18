import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  // repository 접근은 비동기이기 때문에 async 키워드를 사용한다.
  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
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

  async createPost(authorId: number, title: string, content: string) {
    // 1. create -> 저장할 객체를 생성한다.
    // 2. save -> 객체를 저장한다. (create에서 생성한 객체를 저장한다.)

    const post = this.postsRepository.create({
      author: { id: authorId },
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(id: number, title?: string, content?: string) {
    // save의 기능
    // 1. 만약에 데이터가 존재하지 않는다면 새로운 데이터를 생성한다. (id 기준)
    // 2. 만약에 데이터가 존재한다면 데이터를 업데이트한다. (id 기준)

    const findPost = await this.postsRepository.findOne({ where: { id } });

    if (!findPost) {
      throw new NotFoundException();
    }

    const post = this.postsRepository.create({
      id,
      title,
      content,
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
