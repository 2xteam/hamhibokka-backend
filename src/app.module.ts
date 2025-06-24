import { Module } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GoalsModule } from './goals/goals.module';
import { FollowsModule } from './follows/follows.module';
import { StickersModule } from './stickers/stickers.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true, // 프로덕션에서도 playground 활성화
      introspection: true, // 스키마 조회 허용
      context: ({ req }) => ({ req }),
      csrfPrevention: false,
    }),
    AuthModule,
    UsersModule,
    GoalsModule,
    FollowsModule,
    StickersModule,
  ],
  providers: [
    AppResolver,
  ],
})
export class AppModule {}