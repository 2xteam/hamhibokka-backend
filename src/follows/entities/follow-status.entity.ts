import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FollowStatus {
  @Field({ nullable: true })
  followStatus?: string;

  @Field({ nullable: true })
  followId?: string;
}
