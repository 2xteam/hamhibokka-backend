import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalInput } from './dto/goal.input';
import { LeaveGoalInput } from './dto/leave-goal.input';
import { Goal } from './entities/goal.entity';
import { GoalsService } from './goals.service';

@Resolver(() => Goal)
export class GoalsResolver {
  constructor(private readonly goalsService: GoalsService) {}

  @Query(() => [Goal], { name: 'getGoals' })
  @UseGuards(JwtAuthGuard)
  async getGoals(@CurrentUser() userId: string) {
    return this.goalsService.findAll(userId);
  }

  @Query(() => [Goal], { name: 'getMyParticipatedGoals' })
  @UseGuards(JwtAuthGuard)
  async getMyParticipatedGoals(@CurrentUser() userId: string) {
    return this.goalsService.findMyParticipatedGoals(userId);
  }

  @Query(() => [Goal], { name: 'getFollowedUsersGoals' })
  @UseGuards(JwtAuthGuard)
  async getFollowedUsersGoals(@CurrentUser() userId: string) {
    return this.goalsService.findFollowedUsersGoals(userId);
  }

  @Query(() => [Goal], { name: 'getGoalsByUserId' })
  @UseGuards(JwtAuthGuard)
  async getGoalsByUserId(@Args('userId') targetUserId: string) {
    return this.goalsService.findAll(targetUserId);
  }

  @Query(() => Goal, { name: 'getGoal', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getGoal(@Args('id') id: string, @CurrentUser() userId: string) {
    return this.goalsService.findOne(id, userId);
  }

  @Query(() => [Goal], { name: 'searchGoalsByTitle' })
  @UseGuards(JwtAuthGuard)
  async searchGoalsByTitle(
    @Args('title') title: string,
    @CurrentUser() userId: string,
  ) {
    return this.goalsService.searchGoalsByTitle(title, userId);
  }

  @Mutation(() => Goal, { name: 'createGoal' })
  @UseGuards(JwtAuthGuard)
  async createGoal(
    @Args('input') input: GoalInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalsService.create(input, userId);
  }

  @Mutation(() => Goal, { name: 'updateGoal' })
  @UseGuards(JwtAuthGuard)
  async updateGoal(
    @Args('id') id: string,
    @Args('input') input: GoalInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalsService.update(id, input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  @UseGuards(JwtAuthGuard)
  async deleteGoal(@Args('id') id: string, @CurrentUser() userId: string) {
    return this.goalsService.remove(id, userId);
  }

  @Mutation(() => Goal, { name: 'leaveGoal' })
  @UseGuards(JwtAuthGuard)
  async leaveGoal(
    @Args('input') input: LeaveGoalInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalsService.leaveGoal(
      input.goalId,
      input.participantId,
      userId,
    );
  }
}
