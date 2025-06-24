import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Goal {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;
} 