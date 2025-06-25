import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class FollowInput {
  @Field()
  followerId: string;

  @Field()
  followingId: string;
} 