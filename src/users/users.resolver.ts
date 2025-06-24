import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';

@Resolver('User')
export class UsersResolver {
  @Query(() => String, { name: 'getUser' })
  getUser(@Args('id') id: string) {
    return 'get user by id';
  }

  @Query(() => [String], { name: 'getUsers' })
  getUsers() {
    return ['user1', 'user2'];
  }

  @Mutation(() => String, { name: 'createUser' })
  createUser() {
    return 'create user';
  }

  @Mutation(() => String, { name: 'updateUser' })
  updateUser(@Args('id') id: string) {
    return 'update user';
  }

  @Mutation(() => String, { name: 'deleteUser' })
  deleteUser(@Args('id') id: string) {
    return 'delete user';
  }
} 