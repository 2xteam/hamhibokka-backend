import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FollowDocument,
  Follow as FollowSchema,
} from '../schemas/follow.schema';
import { FollowInput } from './dto/follow.input';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(FollowSchema.name)
    private readonly followModel: Model<FollowDocument>,
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
}
