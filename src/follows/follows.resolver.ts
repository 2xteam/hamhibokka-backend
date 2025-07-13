import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowInput } from './dto/follow.input';
import { Follow } from './entities/follow.entity';
import { FollowsService } from './follows.service';

@Resolver(() => Follow)
export class FollowsResolver {
  constructor(private readonly followsService: FollowsService) {}

  @Query(() => [Follow], { name: 'getFollows' })
  async getFollows() {
    return this.followsService.findAll();
  }

  @Query(() => Follow, { name: 'getFollow', nullable: true })
  async getFollow(@Args('id') id: string) {
    return this.followsService.findOne(id);
  }

  @Mutation(() => Follow, { name: 'createFollow' })
  @UseGuards(JwtAuthGuard)
  async createFollow(
    @Args('input') input: FollowInput,
    @CurrentUser() userId: string,
  ) {
    return this.followsService.create(input, userId);
  }

  @Mutation(() => Follow, { name: 'updateFollow' })
  @UseGuards(JwtAuthGuard)
  async updateFollow(
    @Args('id') id: string,
    @Args('input') input: FollowInput,
    @CurrentUser() userId: string,
  ) {
    return this.followsService.update(id, input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteFollow' })
  @UseGuards(JwtAuthGuard)
  async deleteFollow(@Args('id') id: string, @CurrentUser() userId: string) {
    return this.followsService.remove(id, userId);
  }
}
