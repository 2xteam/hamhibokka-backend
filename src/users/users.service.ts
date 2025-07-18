import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { FollowsService } from '../follows/follows.service';
import { UserDocument, User as UserSchema } from '../schemas/user.schema';
import { UserInput } from './dto/user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserDocument>,
    private readonly followsService: FollowsService,
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

    const usersWithFollowStatus = await Promise.all(
      users.map(async (u) => {
        let followStatus: string | undefined = undefined;
        if (currentUserId && currentUserId !== u.userId) {
          // 양방향 팔로우 관계 확인
          const followStatus1 = await this.followsService.checkFollowStatus(
            currentUserId,
            u.userId,
          );
          const followStatus2 = await this.followsService.checkFollowStatus(
            u.userId,
            currentUserId,
          );

          // 둘 중 하나라도 approved 상태이면 approved로 설정
          if (
            followStatus1.followStatus === 'approved' ||
            followStatus2.followStatus === 'approved'
          ) {
            followStatus = 'approved';
          } else if (
            followStatus1.followStatus === 'pending' ||
            followStatus2.followStatus === 'pending'
          ) {
            followStatus = 'pending';
          }
        }

        return {
          id: u._id ? String(u._id) : '',
          userId: u.userId,
          email: u.email,
          nickname: u.nickname,
          profileImage: u.profileImage,
          password: u.password,
          followStatus,
        };
      }),
    );

    // 본인 계정 제외
    const filteredUsers = usersWithFollowStatus.filter(
      (user) => user.userId !== currentUserId,
    );

    return filteredUsers;
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

  async remove(id: string): Promise<boolean> {
    const res = await this.userModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
