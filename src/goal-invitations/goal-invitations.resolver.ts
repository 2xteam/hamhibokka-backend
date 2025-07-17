import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateGoalInvitationInput,
  CreateGoalJoinRequestInput,
  UpdateGoalInvitationInput,
} from './dto/goal-invitation.input';
import { GoalInvitation } from './entities/goal-invitation.entity';
import { GoalInvitationsService } from './goal-invitations.service';

@Resolver(() => GoalInvitation)
export class GoalInvitationsResolver {
  constructor(
    private readonly goalInvitationsService: GoalInvitationsService,
  ) {}

  @Query(() => [GoalInvitation], { name: 'getInvitations' })
  @UseGuards(JwtAuthGuard)
  async getInvitations(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findInvitations(userId);
  }

  @Query(() => GoalInvitation, { name: 'getInvitation', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getInvitation(@Args('id') id: string) {
    return this.goalInvitationsService.findOne(id);
  }

  @Mutation(() => GoalInvitation, { name: 'createGoalInvitation' })
  @UseGuards(JwtAuthGuard)
  async createGoalInvitation(
    @Args('input') input: CreateGoalInvitationInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.create(input, userId);
  }

  @Mutation(() => GoalInvitation, { name: 'createGoalJoinRequest' })
  @UseGuards(JwtAuthGuard)
  async createGoalJoinRequest(
    @Args('input') input: CreateGoalJoinRequestInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.createJoinRequest(input, userId);
  }

  @Mutation(() => GoalInvitation, { name: 'updateGoalInvitation' })
  @UseGuards(JwtAuthGuard)
  async updateGoalInvitation(
    @Args('id') id: string,
    @Args('input') input: UpdateGoalInvitationInput,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.update(id, input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteGoalInvitation' })
  @UseGuards(JwtAuthGuard)
  async deleteGoalInvitation(
    @Args('id') id: string,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.remove(id, userId);
  }
}
