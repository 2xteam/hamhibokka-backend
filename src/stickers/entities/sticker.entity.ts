import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Sticker {
  @Field(() => ID)
  id: string;

  @Field()
  goalId: string;

  @Field()
  recipientId: string;

  @Field()
  stickerImageId: string;
} 