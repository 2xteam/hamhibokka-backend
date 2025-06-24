import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { FollowsService } from './follows.service';
import { Follow } from './entities/follow.entity';
import { FollowInput } from './dto/follow.input';

@Resolver(() => Follow)
export class FollowsResolver {
  constructor(private readonly followsService: FollowsService) {}

  @Query(() => Follow, { name: 'getFollow' })
  getFollow(@Args('id') id: string) {
    return this.followsService.findOne(id);
  }

  @Query(() => [Follow], { name: 'getFollows' })
  getFollows() {
    return this.followsService.findAll();
  }

  @Mutation(() => Follow, { name: 'createFollow' })
  createFollow(@Args('input') input: FollowInput) {
    return this.followsService.create(input);
  }

  @Mutation(() => Follow, { name: 'updateFollow' })
  updateFollow(@Args('id') id: string, @Args('input') input: FollowInput) {
    return this.followsService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteFollow' })
  deleteFollow(@Args('id') id: string) {
    return this.followsService.remove(id);
  }
} 