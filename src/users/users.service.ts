import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { FollowsService } from '../follows/follows.service';
import { GoalInvitationsService } from '../goal-invitations/goal-invitations.service';
import { GoalsService } from '../goals/goals.service';
import { UserDocument, User as UserSchema } from '../schemas/user.schema';
import { UserInput } from './dto/user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => FollowsService))
    private readonly followsService: FollowsService,
    @Inject(forwardRef(() => GoalsService))
    private readonly goalsService: GoalsService,
    @Inject(forwardRef(() => GoalInvitationsService))
    private readonly goalInvitationsService: GoalInvitationsService,
  ) {}

  async create(input: UserInput): Promise<User> {
    const hashedPassword = bcrypt.hashSync(input.password, 10);
    const user = new this.userModel({
      userId: input.userId,
      email: input.email,
      nickname: input.nickname,
      profileImage: input.profileImage,
      password: hashedPassword,
    });
    const saved = await user.save();
    return {
      id: saved._id ? String(saved._id) : '',
      userId: saved.userId,
      email: saved.email,
      nickname: saved.nickname,
      profileImage: saved.profileImage,
      password: saved.password,
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().sort({ createdAt: -1 });
    return users.map((u) => ({
      id: u._id ? String(u._id) : '',
      userId: u.userId,
      email: u.email,
      nickname: u.nickname,
      profileImage: u.profileImage,
      password: u.password,
    }));
  }

  async findOne(id: string): Promise<User | undefined> {
    const u = await this.userModel.findById(id);
    if (!u) return undefined;
    return {
      id: u._id ? String(u._id) : '',
      userId: u.userId,
      email: u.email,
      nickname: u.nickname,
      profileImage: u.profileImage,
      password: u.password,
    };
  }

  async findByUserId(userId: string): Promise<User | undefined> {
    const u = await this.userModel.findOne({ userId });
    if (!u) return undefined;
    return {
      id: u._id ? String(u._id) : '',
      userId: u.userId,
      email: u.email,
      nickname: u.nickname,
      profileImage: u.profileImage,
      password: u.password,
    };
  }

  async findByNickname(
    nickname: string,
    currentUserId?: string,
  ): Promise<User[]> {
    const users = await this.userModel
      .find({
        nickname: { $regex: nickname, $options: 'i' },
      })
      .sort({ createdAt: -1 });

    const mappedUsers = users.map((u) => ({
      id: u._id ? String(u._id) : '',
      userId: u.userId,
      email: u.email,
      nickname: u.nickname,
      profileImage: u.profileImage,
      password: u.password,
    }));

    // 본인 계정 제외
    const filteredUsers = mappedUsers.filter(
      (user) => user.userId !== currentUserId,
    );

    // followStatus 계산
    const usersWithFollowStatus = await Promise.all(
      filteredUsers.map(async (user) => {
        let followStatus: string | undefined = undefined;
        if (currentUserId) {
          try {
            const followStatusResult =
              await this.followsService.checkFollowStatus(
                currentUserId,
                user.userId,
              );
            followStatus = followStatusResult.followStatus;
          } catch (error) {
            console.error('Error checking follow status:', error);
            followStatus = undefined;
          }
        }
        return {
          ...user,
          followStatus: followStatus || null,
        };
      }),
    );

    return usersWithFollowStatus;
  }

  async update(id: string, input: UserInput): Promise<User | undefined> {
    const hashedPassword = bcrypt.hashSync(input.password, 10);
    const u = await this.userModel.findByIdAndUpdate(
      id,
      {
        userId: input.userId,
        email: input.email,
        nickname: input.nickname,
        profileImage: input.profileImage,
        password: hashedPassword,
      },
      { new: true },
    );
    if (!u) return undefined;
    return {
      id: u._id ? String(u._id) : '',
      userId: u.userId,
      email: u.email,
      nickname: u.nickname,
      profileImage: u.profileImage,
      password: u.password,
    };
  }

  async updateNickname(
    userId: string,
    nickname: string,
  ): Promise<User | undefined> {
    const user = await this.userModel.findOneAndUpdate(
      { userId },
      { nickname },
      { new: true },
    );

    if (!user) return undefined;

    return {
      id: user._id ? String(user._id) : '',
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      password: user.password,
    };
  }

  async updateProfileImage(
    userId: string,
    profileImageUrl: string,
  ): Promise<User | undefined> {
    const user = await this.userModel.findOneAndUpdate(
      { userId },
      { profileImage: profileImageUrl },
      { new: true },
    );

    if (!user) return undefined;

    return {
      id: user._id ? String(user._id) : '',
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      password: user.password,
    };
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.userModel.findById(id);
    if (!user) {
      return false;
    }

    const userId = user.userId;

    try {
      // 1. 사용자와 관련된 모든 팔로우 관계 삭제 (친구 관계만 제거)
      await this.followsService.removeAllUserFollows(userId);

      // 2. 사용자가 참여하고 있는 목표들에서 참여자 정보만 제거 (목표는 유지)
      await this.goalsService.removeUserFromAllGoals(userId);

      // 3. 사용자와 관련된 모든 목표 초대 삭제
      await this.goalInvitationsService.removeAllUserInvitations(userId);

      // 4. 마지막으로 사용자 삭제 (생성된 목표들은 유지)
      const res = await this.userModel.deleteOne({ _id: id });
      return res.deletedCount > 0;
    } catch (error) {
      console.error('Error removing user and related data:', error);
      throw new Error('사용자 삭제 중 오류가 발생했습니다.');
    }
  }
}
