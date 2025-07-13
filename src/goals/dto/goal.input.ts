import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GoalInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  stickerCount: number;

  @Field({ nullable: true })
  mode?: string;

  @Field({ nullable: true })
  visibility?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  autoApprove?: boolean;
}
