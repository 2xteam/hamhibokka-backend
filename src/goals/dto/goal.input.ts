import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GoalInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;
} 