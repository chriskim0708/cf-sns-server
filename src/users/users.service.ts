import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private usersRepository: Repository<UsersModel>,
  ) {}

  async createUser(nickname: string, email: string, password: string) {
    // 1) nickname 중복이 없는지 확인
    // exist() -> 만약에 조건이 해당되는 값이 있으면 true, 없으면 false
    const nicknameExists = await this.usersRepository.exists({
      where: { nickname },
    });

    if (nicknameExists) {
      throw new BadRequestException('이미 존재하는 nickname 입니다.');
    }

    const emailExists = await this.usersRepository.exists({ where: { email } });

    if (emailExists) {
      throw new BadRequestException('이미 가입한 email 입니다.');
    }

    const userObject = this.usersRepository.create({
      nickname,
      email,
      password,
    });

    const newUser = await this.usersRepository.save(userObject);

    return newUser;
  }

  async getAllUsers() {
    return this.usersRepository.find();
  }

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }
}
