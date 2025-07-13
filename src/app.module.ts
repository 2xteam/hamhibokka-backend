import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppResolver } from './app.resolver';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { FollowsModule } from './follows/follows.module';
import { GoalInvitationsModule } from './goal-invitations/goal-invitations.module';
import { GoalsModule } from './goals/goals.module';
import { StickerImagesModule } from './sticker-images/sticker-images.module';
import { StickersModule } from './stickers/stickers.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true, // 프로덕션에서도 playground 활성화
      introspection: true, // 스키마 조회 허용
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      context: ({ req }) => ({ req }),
      csrfPrevention: false,
    }),
    AuthModule,
    UsersModule,
    GoalsModule,
    FollowsModule,
    StickersModule,
    UploadModule,
    StickerImagesModule,
    GoalInvitationsModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
