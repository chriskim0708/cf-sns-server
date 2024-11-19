import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersModel])],
  exports: [UsersService], // 다른 모듈에서 사용하고자 할 때 export 해준다.
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
