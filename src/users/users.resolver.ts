import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateNicknameInput,
  UpdateProfileImageInput,
  UserInput,
} from './dto/user.input';
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

  @Query(() => String, { name: 'getMyProfileImage', nullable: true })
  @UseGuards(JwtAuthGuard)
  async getMyProfileImage(@CurrentUser() userId: string) {
    const user = await this.usersService.findOne(userId);
    return user?.profileImage || null;
  }

  @Mutation(() => User, { name: 'createUser' })
  createUser(@Args('input') input: UserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => User, { name: 'updateUser' })
  updateUser(@Args('id') id: string, @Args('input') input: UserInput) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => User, { name: 'updateProfileImage' })
  @UseGuards(JwtAuthGuard)
  updateProfileImage(
    @Args('input') input: UpdateProfileImageInput,
    @CurrentUser() userId: string,
  ) {
    return this.usersService.updateProfileImage(userId, input.profileImage);
  }

  @Mutation(() => User, { name: 'updateNickname' })
  @UseGuards(JwtAuthGuard)
  updateNickname(
    @Args('input') input: UpdateNicknameInput,
    @CurrentUser() userId: string,
  ) {
    return this.usersService.updateNickname(userId, input.nickname);
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Args('id') id: string,
    @CurrentUser() currentUserId: string,
  ) {
    // 본인 계정만 삭제 가능
    const user = await this.usersService.findOne(id);
    if (!user || user.userId !== currentUserId) {
      throw new Error('자신의 계정만 삭제할 수 있습니다.');
    }
    return this.usersService.remove(id);
  }
}
