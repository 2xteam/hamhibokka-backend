import { Field, InputType } from '@nestjs/graphql';

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

@InputType()
export class UpdateProfileImageInput {
  @Field()
  profileImage: string;
}

@InputType()
export class UpdateNicknameInput {
  @Field()
  nickname: string;
}
