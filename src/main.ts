import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // class-transformer와 class-validator를 사용하기 위한 설정
  app.useGlobalPipes(
    new ValidationPipe({
      // entity, dto default value를 사용하기 위한 설정
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // dto의 class-validator 타입을 보고 자동으로 타입을 변환한다.
      },
      whitelist: true, // dto에 정의되지 않은 속성은 제거한다.
      forbidNonWhitelisted: true, // dto에 정의되지 않은 속성이 있을 경우 요청을 막고 에러를 반환한다.
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
