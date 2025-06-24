import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS 설정 (필요한 경우)
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // 모든 IP에서 접근 가능하도록 설정
  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Server running on http://0.0.0.0:3000/graphql');

  console.log('🚀 Hamhibokka Backend github actions Tested!!');
}
bootstrap();