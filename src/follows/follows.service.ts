import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow } from './entities/follow.entity';
import { Follow as FollowSchema, FollowDocument } from '../schemas/follow.schema';
import { FollowInput } from './dto/follow.input';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(FollowSchema.name)
    private readonly followModel: Model<FollowDocument>,
  ) {}

  async create(input: FollowInput): Promise<Follow> {
    const follow = new this.followModel({
      followerId: input.followerId,
      followingId: input.followingId,
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
    return follows.map(f => ({
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

  async update(id: string, input: FollowInput): Promise<Follow | undefined> {
    const f = await this.followModel.findByIdAndUpdate(
      id,
      {
        followerId: input.followerId,
        followingId: input.followingId,
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

  async remove(id: string): Promise<boolean> {
    const res = await this.followModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
} 