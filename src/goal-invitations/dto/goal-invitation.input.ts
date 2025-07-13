import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGoalInvitationInput {
  @Field()
  goalId: string;

  @Field()
  toUserId: string;

  @Field()
  type: string; // 'invite' 또는 'request'

  @Field({ nullable: true })
  message?: string;
}

@InputType()
export class CreateGoalJoinRequestInput {
  @Field()
  goalId: string;

  @Field({ nullable: true })
  message?: string;
}

@InputType()
export class UpdateGoalInvitationInput {
  @Field()
  status: string; // 'accepted', 'rejected', 'cancelled'

  @Field({ nullable: true })
  message?: string;
}
