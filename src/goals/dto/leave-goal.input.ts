import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class LeaveGoalInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  goalId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  participantId: string;
}
