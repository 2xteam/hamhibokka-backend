import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StickerReceivedLog {
  @Field()
  date: Date; // Date 타입으로 변경

  @Field()
  count: number;
}

@ObjectType()
export class GoalParticipant {
  @Field()
  userId: string;

  @Field({ nullable: true })
  nickname?: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field()
  status: string;

  @Field()
  currentStickerCount: number;

  @Field()
  joinedAt: Date;

  @Field(() => [StickerReceivedLog], { nullable: true })
  stickerReceivedLogs?: StickerReceivedLog[];
}
