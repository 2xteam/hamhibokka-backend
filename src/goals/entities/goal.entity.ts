import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GoalParticipant } from './goal-participant.entity';

@ObjectType()
export class Goal {
  @Field(() => ID)
  id: string;

  @Field()
  goalId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  stickerCount: number;

  @Field({ nullable: true })
  mode?: string;

  @Field({ nullable: true })
  visibility?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  creatorNickname?: string;

  @Field({ nullable: true })
  autoApprove?: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  isParticipant?: boolean;

  @Field(() => [GoalParticipant], { nullable: true })
  participants?: GoalParticipant[];
}
