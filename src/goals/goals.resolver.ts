import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';
import { GoalInput } from './dto/goal.input';

@Resolver(() => Goal)
export class GoalsResolver {
  constructor(private readonly goalsService: GoalsService) {}

  @Query(() => [Goal], { name: 'getGoals' })
  async getGoals() {
    return this.goalsService.findAll();
  }

  @Query(() => Goal, { name: 'getGoal', nullable: true })
  async getGoal(@Args('id') id: string) {
    return this.goalsService.findOne(id);
  }

  @Mutation(() => Goal, { name: 'createGoal' })
  async createGoal(@Args('input') input: GoalInput) {
    return this.goalsService.create(input);
  }

  @Mutation(() => Goal, { name: 'updateGoal' })
  async updateGoal(@Args('id') id: string, @Args('input') input: GoalInput) {
    return this.goalsService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  async deleteGoal(@Args('id') id: string) {
    return this.goalsService.remove(id);
  }
} 