import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  email: string;

  @Field()
  nickname: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field({ nullable: true })
  isFollowed?: boolean;

  // GraphQL에는 노출하지 않음
  password: string;
}
