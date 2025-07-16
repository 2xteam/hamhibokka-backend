import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FollowDocument,
  Follow as FollowSchema,
} from '../schemas/follow.schema';
import { UsersService } from '../users/users.service';
import { FollowInput } from './dto/follow.input';
import { FollowStatus } from './entities/follow-status.entity';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(FollowSchema.name)
    private readonly followModel: Model<FollowDocument>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(input: FollowInput, userId: string): Promise<Follow> {
    const follow = new this.followModel({
      followerId: input.followerId,
      followingId: input.followingId,
      createdBy: userId,
      updatedBy: userId,
      // status 등 필요한 필드 추가
    });
    const saved = await follow.save();
    return {
      id: saved._id ? String(saved._id) : '',
      followerId: saved.followerId,
      followingId: saved.followingId,
    };
  }

  async findAll(): Promise<Follow[]> {
    const follows = await this.followModel.find();
    return follows.map((f) => ({
      id: f._id ? String(f._id) : '',
      followerId: f.followerId,
      followingId: f.followingId,
    }));
  }

  async findOne(id: string): Promise<Follow | undefined> {
    const f = await this.followModel.findById(id);
    if (!f) return undefined;
    return {
      id: f._id ? String(f._id) : '',
      followerId: f.followerId,
      followingId: f.followingId,
    };
  }

  async update(
    id: string,
    input: FollowInput,
    userId: string,
  ): Promise<Follow | undefined> {
    const f = await this.followModel.findByIdAndUpdate(
      id,
      {
        followerId: input.followerId,
        followingId: input.followingId,
        updatedBy: userId,
      },
      { new: true },
    );
    if (!f) return undefined;
    return {
      id: f._id ? String(f._id) : '',
      followerId: f.followerId,
      followingId: f.followingId,
    };
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const f = await this.followModel.findByIdAndUpdate(
      id,
      { updatedBy: userId },
      { new: true },
    );
    if (!f) return false;
    const res = await this.followModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.followModel.findOne({
      followerId,
      followingId,
    });
    return !!follow;
  }

  async checkFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<FollowStatus> {
    const follow = await this.followModel.findOne({
      followerId,
      followingId,
    });

    return {
      isFollowed: !!follow,
      followId: follow?._id ? String(follow._id) : undefined,
    };
  }

  async findUserFollows(userId: string, status?: string): Promise<Follow[]> {
    const query: any = {
      $or: [{ followerId: userId }, { followingId: userId }],
    };

    if (status) {
      query.status = status;
    }

    const follows = await this.followModel.find(query);

    const followsWithUserData = await Promise.all(
      follows.map(async (f: any) => {
        let followerNickname: string | undefined = undefined;
        let followingNickname: string | undefined = undefined;
        let followerEmail: string | undefined = undefined;
        let followerProfileImage: string | undefined = undefined;
        let followingEmail: string | undefined = undefined;
        let followingProfileImage: string | undefined = undefined;

        try {
          const follower = await this.usersService.findByUserId(f.followerId);
          followerNickname = follower?.nickname;
          followerEmail = follower?.email;
          followerProfileImage = follower?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching follower data for user ${f.followerId}:`,
            error,
          );
        }

        try {
          const following = await this.usersService.findByUserId(f.followingId);
          followingNickname = following?.nickname;
          followingEmail = following?.email;
          followingProfileImage = following?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching following data for user ${f.followingId}:`,
            error,
          );
        }

        return {
          id: f._id ? String(f._id) : '',
          followerId: f.followerId,
          followingId: f.followingId,
          followerNickname,
          followingNickname,
          followerEmail,
          followerProfileImage,
          followingEmail,
          followingProfileImage,
          status: f.status,
          approvedAt: f.approvedAt,
          createdBy: f.createdBy,
          updatedBy: f.updatedBy,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        };
      }),
    );

    return followsWithUserData;
  }

  async approveFollow(
    followId: string,
    userId: string,
  ): Promise<Follow | undefined> {
    const follow = await this.followModel.findById(followId);

    if (!follow) {
      throw new Error('팔로우 요청을 찾을 수 없습니다.');
    }

    // 승인 권한 확인 (followingId가 현재 사용자인지 확인)
    if (follow.followingId !== userId) {
      throw new Error('팔로우 요청을 승인할 권한이 없습니다.');
    }

    // 이미 승인된 상태인지 확인
    if (follow.status === 'approved') {
      throw new Error('이미 승인된 팔로우 요청입니다.');
    }

    const updatedFollow = await this.followModel.findByIdAndUpdate(
      followId,
      {
        status: 'approved',
        approvedAt: new Date(),
        updatedBy: userId,
      },
      { new: true },
    );

    if (!updatedFollow) return undefined;

    let followerNickname: string | undefined = undefined;
    let followingNickname: string | undefined = undefined;
    let followerEmail: string | undefined = undefined;
    let followerProfileImage: string | undefined = undefined;
    let followingEmail: string | undefined = undefined;
    let followingProfileImage: string | undefined = undefined;

    try {
      const follower = await this.usersService.findByUserId(
        updatedFollow.followerId,
      );
      followerNickname = follower?.nickname;
      followerEmail = follower?.email;
      followerProfileImage = follower?.profileImage;
    } catch (error) {
      console.error(
        `Error fetching follower data for user ${updatedFollow.followerId}:`,
        error,
      );
    }

    try {
      const following = await this.usersService.findByUserId(
        updatedFollow.followingId,
      );
      followingNickname = following?.nickname;
      followingEmail = following?.email;
      followingProfileImage = following?.profileImage;
    } catch (error) {
      console.error(
        `Error fetching following data for user ${updatedFollow.followingId}:`,
        error,
      );
    }

    return {
      id: updatedFollow._id ? String(updatedFollow._id) : '',
      followerId: updatedFollow.followerId,
      followingId: updatedFollow.followingId,
      followerNickname,
      followingNickname,
      followerEmail,
      followerProfileImage,
      followingEmail,
      followingProfileImage,
      status: updatedFollow.status,
      approvedAt: updatedFollow.approvedAt,
      createdBy: updatedFollow.createdBy,
      updatedBy: updatedFollow.updatedBy,
      createdAt: (updatedFollow as any).createdAt,
      updatedAt: (updatedFollow as any).updatedAt,
    };
  }
}
