import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsModule } from '../follows/follows.module';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { UsersModule } from '../users/users.module';
import { GoalsResolver } from './goals.resolver';
import { GoalsService } from './goals.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
    forwardRef(() => FollowsModule),
    forwardRef(() => UsersModule),
  ],
  providers: [GoalsResolver, GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
