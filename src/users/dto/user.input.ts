import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UserInput {
  @Field()
  email: string;

  @Field()
  nickname: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field()
  userId: string;

  @Field()
  password: string;
} 