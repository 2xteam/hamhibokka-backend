import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsService } from './follows.service';
import { FollowsResolver } from './follows.resolver';
import { Follow, FollowSchema } from '../schemas/follow.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }])],
  providers: [FollowsResolver, FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {} 