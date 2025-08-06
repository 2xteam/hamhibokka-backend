import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ReceiveStickerInput {
  @Field()
  goalId: string;

  @Field()
  toUserId: string;

  @Field()
  stickerCount: number;
}
