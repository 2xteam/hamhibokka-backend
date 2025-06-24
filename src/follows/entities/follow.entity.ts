import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Follow {
  @Field(() => ID)
  id: string;

  @Field()
  followerId: string;

  @Field()
  followingId: string;
} 