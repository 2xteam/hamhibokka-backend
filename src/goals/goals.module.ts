import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalsService } from './goals.service';
import { GoalsResolver } from './goals.resolver';
import { Goal, GoalSchema } from '../schemas/goal.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }])],
  providers: [GoalsResolver, GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {} 