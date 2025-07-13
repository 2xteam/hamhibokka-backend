import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Goal } from '../../goals/entities/goal.entity';

@ObjectType()
export class GoalInvitation {
  @Field(() => ID)
  id: string;

  @Field()
  invitationId: string;

  @Field()
  goalId: string;

  @Field()
  fromUserId: string;

  @Field()
  toUserId: string;

  @Field()
  type: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  respondedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Goal 정보를 중첩된 객체로 추가
  @Field(() => Goal, { nullable: true })
  goal?: Goal;
}
