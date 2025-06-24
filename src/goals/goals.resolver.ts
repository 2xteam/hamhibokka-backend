import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { GoalInput } from './dto/goal.input';

@Resolver(() => Goal)
export class GoalsResolver {
  constructor(private readonly goalsService: GoalsService) {}

  @Query(() => Goal, { name: 'getGoal' })
  getGoal(@Args('id') id: string) {
    return this.goalsService.findOne(id);
  }

  @Query(() => [Goal], { name: 'getGoals' })
  getGoals() {
    return this.goalsService.findAll();
  }

  @Mutation(() => Goal, { name: 'createGoal' })
  createGoal(@Args('input') input: GoalInput) {
    return this.goalsService.create(input);
  }

  @Mutation(() => Goal, { name: 'updateGoal' })
  updateGoal(@Args('id') id: string, @Args('input') input: GoalInput) {
    return this.goalsService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  deleteGoal(@Args('id') id: string) {
    return this.goalsService.remove(id);
  }
} 