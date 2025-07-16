import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserInput } from './dto/user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'getUser', nullable: true })
  async getUser(@Args('id') id: string) {
    return (await this.usersService.findOne(id)) || null;
  }

  @Query(() => [User], { name: 'getUsers' })
  getUsers() {
    return this.usersService.findAll();
  }

  @Query(() => [User], { name: 'searchUsersByNickname' })
  @UseGuards(JwtAuthGuard)
  searchUsersByNickname(
    @Args('nickname') nickname: string,
    @CurrentUser() currentUser?: string,
  ) {
    return this.usersService.findByNickname(nickname, currentUser);
  }

  @Mutation(() => User, { name: 'createUser' })
  createUser(@Args('input') input: UserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => User, { name: 'updateUser' })
  updateUser(@Args('id') id: string, @Args('input') input: UserInput) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  deleteUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }
}
