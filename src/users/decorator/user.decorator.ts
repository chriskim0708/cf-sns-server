import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersModel } from '../entities/users.entity';

/**
 * data: 데코레이터가 사용될 때 전달되는 데이터
 * context: ExecutionContext 인터페이스를 통해 현재 실행 컨텍스트에 접근할 수 있다.
 */
export const User = createParamDecorator(
  (data: keyof UsersModel | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const user = req.user as UsersModel;

    if (!user) {
      throw new InternalServerErrorException(
        'User 데코레이터는 AccessTokenGuard와 사용해야 합니다.',
      );
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
