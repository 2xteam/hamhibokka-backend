import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ReceiveStickerInput {
  @Field()
  goalId: string;

  @Field()
  toUserId: string; // 클라이언트에서 사용하는 필드명

  @Field({ nullable: true })
  recipientId?: string; // 내부적으로 사용할 필드명

  @Field({ nullable: true })
  stickerCount?: number; // 클라이언트 호환성을 위한 필드 (사용되지 않음)
}
