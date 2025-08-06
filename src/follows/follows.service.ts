import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FollowDocument,
  Follow as FollowSchema,
  FollowStatus,
} from '../schemas/follow.schema';
import { UsersService } from '../users/users.service';
import { FollowInput } from './dto/follow.input';
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
    // 기존에 반대 방향의 pending 요청이 있는지 확인
    const existingFollow = await this.followModel.findOne({
      followerId: input.followingId,
      followingId: input.followerId,
      status: 'pending',
    });

    if (existingFollow) {
      // 맞팔로우 상황: 기존 요청을 approved로 변경
      const updatedFollow = await this.followModel.findByIdAndUpdate(
        existingFollow._id,
        {
          status: 'approved',
          approvedAt: new Date(),
          updatedBy: userId,
        },
        { new: true },
      );

      if (!updatedFollow) {
        throw new Error('팔로우 요청 업데이트에 실패했습니다.');
      }

      return {
        id: updatedFollow._id ? String(updatedFollow._id) : '',
        followerId: updatedFollow.followerId,
        followingId: updatedFollow.followingId,
        status: updatedFollow.status,
        approvedAt: updatedFollow.approvedAt,
        createdBy: updatedFollow.createdBy,
        updatedBy: updatedFollow.updatedBy,
        createdAt: (updatedFollow as any).createdAt,
        updatedAt: (updatedFollow as any).updatedAt,
      };
    }

    // 일반적인 팔로우 요청 생성
    const follow = new this.followModel({
      followerId: input.followerId,
      followingId: input.followingId,
      status: 'pending',
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await follow.save();
    return {
      id: saved._id ? String(saved._id) : '',
      followerId: saved.followerId,
      followingId: saved.followingId,
      status: saved.status,
      approvedAt: saved.approvedAt,
      createdBy: saved.createdBy,
      updatedBy: saved.updatedBy,
      createdAt: (saved as any).createdAt,
      updatedAt: (saved as any).updatedAt,
    };
  }

  async findAll(): Promise<Follow[]> {
    const follows = await this.followModel.find().sort({ createdAt: -1 });
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
    // followerId가 요청자, followingId가 대상자인 경우
    const follow1 = await this.followModel.findOne({
      followerId,
      followingId,
      status: 'approved',
    });

    // followerId가 대상자, followingId가 요청자인 경우
    const follow2 = await this.followModel.findOne({
      followerId: followingId,
      followingId: followerId,
      status: 'approved',
    });

    // 둘 중 하나라도 approved 상태인 관계가 있으면 true
    return !!(follow1 || follow2);
  }

  async getFollowedUserIds(userId: string): Promise<string[]> {
    // followerId가 현재 사용자인 경우 (현재 사용자가 팔로우하는 사람들)
    const followsAsFollower = await this.followModel.find({
      followerId: userId,
      status: 'approved',
    });

    // followingId가 현재 사용자인 경우 (현재 사용자를 팔로우하는 사람들)
    const followsAsFollowing = await this.followModel.find({
      followingId: userId,
      status: 'approved',
    });

    // 두 결과를 합쳐서 중복 제거
    const allFollowedUsers = new Set<string>();

    // 현재 사용자가 팔로우하는 사람들
    followsAsFollower.forEach((follow) => {
      allFollowedUsers.add(follow.followingId);
    });

    // 현재 사용자를 팔로우하는 사람들
    followsAsFollowing.forEach((follow) => {
      allFollowedUsers.add(follow.followerId);
    });

    const result = Array.from(allFollowedUsers);

    return result;
  }

  async getFollowRequests(userId: string): Promise<Follow[]> {
    // 현재 사용자가 받은 pending 상태의 팔로우 요청들
    const pendingRequests = await this.followModel
      .find({
        followingId: userId,
        status: 'pending',
      })
      .sort({ createdAt: -1 });

    // 현재 사용자가 보낸 pending 상태의 팔로우 요청들
    const sentRequests = await this.followModel
      .find({
        followerId: userId,
        status: 'pending',
      })
      .sort({ createdAt: -1 });

    // 받은 요청들 처리
    const pendingWithUserData = await Promise.all(
      pendingRequests.map(async (f: any) => {
        let followerNickname: string | undefined = undefined;
        let followerEmail: string | undefined = undefined;
        let followerProfileImage: string | undefined = undefined;

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

        return {
          id: f._id ? String(f._id) : '',
          followerId: f.followerId,
          followingId: f.followingId,
          followerNickname,
          followingNickname: undefined,
          followerEmail,
          followerProfileImage,
          followingEmail: undefined,
          followingProfileImage: undefined,
          status: f.status,
          approvedAt: f.approvedAt,
          createdBy: f.createdBy,
          updatedBy: f.updatedBy,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        };
      }),
    );

    // 보낸 요청들 처리
    const sentWithUserData = await Promise.all(
      sentRequests.map(async (f: any) => {
        let followingNickname: string | undefined = undefined;
        let followingEmail: string | undefined = undefined;
        let followingProfileImage: string | undefined = undefined;

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
          followerNickname: undefined,
          followingNickname,
          followerEmail: undefined,
          followerProfileImage: undefined,
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

    // 받은 요청과 보낸 요청을 합쳐서 반환
    return [...pendingWithUserData, ...sentWithUserData];
  }

  async checkFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<{ followStatus?: string; followId?: string }> {
    // 양방향 팔로우 관계 확인
    const forwardFollow = await this.followModel.findOne({
      followerId,
      followingId,
    });

    const reverseFollow = await this.followModel.findOne({
      followerId: followingId,
      followingId: followerId,
    });

    // 맞팔로우 상태 확인
    if (forwardFollow && reverseFollow) {
      // 양방향 모두 존재하고 approved이면 맞팔로우
      if (
        forwardFollow.status === FollowStatus.APPROVED &&
        reverseFollow.status === FollowStatus.APPROVED
      ) {
        return {
          followStatus: FollowStatus.MUTUAL,
          followId: forwardFollow._id ? String(forwardFollow._id) : undefined,
        };
      }
    }

    // 단방향 팔로우 상태 반환 (또는 관계 없음)
    // forwardFollow가 있으면 그 상태를, 없으면 reverseFollow의 상태를 반환
    let result;
    if (forwardFollow) {
      result = {
        followStatus: forwardFollow.status,
        followId: forwardFollow._id ? String(forwardFollow._id) : undefined,
      };
    } else if (reverseFollow) {
      result = {
        followStatus: reverseFollow.status,
        followId: reverseFollow._id ? String(reverseFollow._id) : undefined,
      };
    } else {
      result = {
        followStatus: undefined,
        followId: undefined,
      };
    }

    return result;
  }

  async findUserFollows(userId: string, status?: string): Promise<Follow[]> {
    const query: any = {
      $or: [{ followerId: userId }, { followingId: userId }],
    };

    if (status) {
      query.status = status;
    }

    const follows = await this.followModel.find(query).sort({ createdAt: -1 });

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
