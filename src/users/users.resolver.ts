import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserInput } from './dto/user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'getUser', nullable: true })
  getUser(@Args('id') id: string) {
    return this.usersService.findOne(id) || null;
  }

  @Query(() => [User], { name: 'getUsers' })
  getUsers() {
    return this.usersService.findAll();
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