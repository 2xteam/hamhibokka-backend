import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class StickerInput {
  @Field()
  goalId: string;

  @Field()
  recipientId: string;

  @Field()
  stickerImageId: string;
} 