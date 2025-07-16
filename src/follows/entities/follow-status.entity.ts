import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FollowStatus {
  @Field()
  isFollowed: boolean;

  @Field({ nullable: true })
  followId?: string;
}
