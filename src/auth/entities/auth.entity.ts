import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  email: string;

  @Field()
  nickname: string;

  @Field({ nullable: true })
  profileImage?: string;
}


@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  user: User;
}

