import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { In } from 'typeorm';

@Injectable()
export class PasswordPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length > 8) {
      throw new BadRequestException('비밀번호는 8자 이하로 입력해주세요.');
    }
    return value.toString();
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(private readonly maxLength: number) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length > this.maxLength) {
      throw new BadRequestException(
        `최대 ${this.maxLength}자 이하로 입력해주세요.`,
      );
    }

    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(
    private readonly minLength: number,
    private readonly subject: string,
  ) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (value.toString().length < this.minLength) {
      throw new BadRequestException(
        `${this.subject} 최소 ${this.minLength}자 이상 입력해주세요.`,
      );
    }

    return value.toString();
  }
}
