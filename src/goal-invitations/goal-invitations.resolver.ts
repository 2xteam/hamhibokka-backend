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

  @Query(() => [GoalInvitation], { name: 'getMyInvitations' })
  @UseGuards(JwtAuthGuard)
  async getMyInvitations(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findAll(userId);
  }

  @Query(() => [GoalInvitation], { name: 'getReceivedInvitations' })
  @UseGuards(JwtAuthGuard)
  async getReceivedInvitations(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findReceivedInvitations(userId);
  }

  @Query(() => [GoalInvitation], { name: 'getSentInvitations' })
  @UseGuards(JwtAuthGuard)
  async getSentInvitations(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findSentInvitations(userId);
  }

  @Query(() => GoalInvitation, { name: 'getInvitation', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getInvitation(@Args('id') id: string) {
    return this.goalInvitationsService.findOne(id);
  }

  @Query(() => [GoalInvitation], { name: 'getInvitationsByGoalId' })
  @UseGuards(JwtAuthGuard)
  async getInvitationsByGoalId(
    @Args('goalId') goalId: string,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.findInvitationsByGoalId(goalId, userId);
  }

  @Query(() => [GoalInvitation], { name: 'getReceivedInvites' })
  @UseGuards(JwtAuthGuard)
  async getReceivedInvites(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findReceivedInvites(userId);
  }

  @Query(() => [GoalInvitation], { name: 'getSentInvites' })
  @UseGuards(JwtAuthGuard)
  async getSentInvites(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findSentInvites(userId);
  }

  @Query(() => [GoalInvitation], { name: 'getSentRequests' })
  @UseGuards(JwtAuthGuard)
  async getSentRequests(@CurrentUser() userId: string) {
    return this.goalInvitationsService.findSentRequests(userId);
  }

  @Query(() => [GoalInvitation], { name: 'getInvitationsByStatus' })
  @UseGuards(JwtAuthGuard)
  async getInvitationsByStatus(
    @Args('status') status: string,
    @CurrentUser() userId: string,
  ) {
    return this.goalInvitationsService.findInvitationsByStatus(
      userId,
      status as any,
    );
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
