import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GoalParticipant {
  @Field()
  userId: string;

  @Field({ nullable: true })
  nickname?: string;

  @Field()
  status: string;

  @Field()
  currentStickerCount: number;

  @Field()
  joinedAt: Date;
}
