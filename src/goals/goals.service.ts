import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowsService } from '../follows/follows.service';
import {
  GoalDocument,
  Goal as GoalSchema,
  GoalVisibility,
} from '../schemas/goal.schema';
import { UsersService } from '../users/users.service';
import { GoalInput } from './dto/goal.input';
import { Goal } from './entities/goal.entity';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(GoalSchema.name)
    private readonly goalModel: Model<GoalDocument>,
    private readonly followsService: FollowsService,
    private readonly usersService: UsersService,
  ) {}

  async create(input: GoalInput, userId: string): Promise<Goal> {
    // mode에 따라 visibility, autoApprove 기본값 결정
    let visibility: string | undefined = undefined;
    let autoApprove: boolean | undefined = undefined;
    const mode = input.mode ? input.mode.toLowerCase() : 'personal';
    if (mode === 'personal') {
      visibility = 'private';
      autoApprove = true;
    } else if (mode === 'competition') {
      visibility = 'public';
      autoApprove = false;
    } else if (mode === 'challenger_recruitment') {
      visibility = 'followers';
      autoApprove = false;
    }
    // 입력값이 있으면 우선 적용
    if (input.visibility) visibility = input.visibility.toLowerCase();
    if (typeof input.autoApprove === 'boolean') autoApprove = input.autoApprove;

    const goalData: any = {
      title: input.title,
      description: input.description,
      stickerCount: input.stickerCount,
      mode: input.mode ? input.mode.toLowerCase() : 'personal',
      visibility,
      autoApprove,
      status: input.status || undefined,
      createdBy: userId,
      updatedBy: userId,
      goalId: `goal_${Math.random().toString(36).substr(2, 9)}`,
      participants: [
        {
          userId: userId,
          currentStickerCount: 0,
        },
      ],
    };
    const goal = new this.goalModel(goalData);
    const saved = await goal.save();
    return {
      id: saved._id ? String(saved._id) : '',
      goalId: saved.goalId,
      title: saved.title,
      description: saved.description,
      stickerCount: saved.stickerCount,
      mode: saved.mode,
      visibility: saved.visibility,
      status: saved.status,
      createdBy: saved.createdBy,
      autoApprove: saved.autoApprove,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      participants:
        saved.participants?.map((p) => ({
          userId: p.userId,
          status: p.status,
          currentStickerCount: p.currentStickerCount,
          joinedAt: p.joinedAt,
        })) || [],
    };
  }

  async findAll(userId?: string): Promise<Goal[]> {
    let goals = await this.goalModel.find();

    // userId가 제공된 경우 visibility에 따른 필터링 적용
    if (userId) {
      const filteredGoals: typeof goals = [];
      for (const goal of goals) {
        // PUBLIC인 경우 모든 사용자가 볼 수 있음
        if (goal.visibility === GoalVisibility.PUBLIC) {
          filteredGoals.push(goal);
          continue;
        }

        // PRIVATE인 경우 참여자만 볼 수 있음
        if (goal.visibility === GoalVisibility.PRIVATE) {
          if (goal.participants?.some((p) => p.userId === userId)) {
            filteredGoals.push(goal);
          }
          continue;
        }

        // FOLLOWERS인 경우 팔로워만 볼 수 있음
        if (goal.visibility === GoalVisibility.FOLLOWERS) {
          // Goal 생성자를 팔로우하고 있는지 확인
          const isFollowing = await this.followsService.isFollowing(
            userId,
            goal.createdBy,
          );
          if (goal.createdBy === userId || isFollowing) {
            filteredGoals.push(goal);
          }
          continue;
        }
      }
      goals = filteredGoals;
    }

    return goals.map((g) => ({
      id: g._id ? String(g._id) : '',
      goalId: g.goalId,
      title: g.title,
      description: g.description,
      stickerCount: g.stickerCount,
      mode: g.mode,
      visibility: g.visibility,
      status: g.status,
      createdBy: g.createdBy,
      autoApprove: g.autoApprove,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      participants:
        g.participants?.map((p) => ({
          userId: p.userId,
          status: p.status,
          currentStickerCount: p.currentStickerCount,
          joinedAt: p.joinedAt,
        })) || [],
    }));
  }

  async findOne(id: string, userId?: string): Promise<Goal | undefined> {
    const g = await this.goalModel.findById(id);
    if (!g) return undefined;

    // creator의 nickname 조회
    let creatorNickname: string | undefined = undefined;
    if (g.createdBy) {
      try {
        const creator = await this.usersService.findByUserId(g.createdBy);
        creatorNickname = creator?.nickname;
      } catch (error) {
        console.error('Error fetching creator nickname:', error);
      }
    }

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (g.participants) {
      for (const participant of g.participants) {
        let nickname: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(participant.userId);
          nickname = user?.nickname;
        } catch (error) {
          console.error(
            `Error fetching nickname for user ${participant.userId}:`,
            error,
          );
        }

        participantsWithNicknames.push({
          userId: participant.userId,
          nickname,
          status: participant.status,
          currentStickerCount: participant.currentStickerCount,
          joinedAt: participant.joinedAt,
        });
      }
    }

    // 호출자가 참여 중인지 확인
    let isParticipant: boolean = false;
    if (userId && g.participants) {
      isParticipant = g.participants.some((p) => p.userId === userId);
    }

    return {
      id: g._id ? g._id.toString() : '',
      goalId: g.goalId,
      title: g.title,
      description: g.description,
      stickerCount: g.stickerCount,
      mode: g.mode,
      visibility: g.visibility,
      status: g.status,
      createdBy: g.createdBy,
      creatorNickname,
      autoApprove: g.autoApprove,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      isParticipant,
      participants: participantsWithNicknames,
    };
  }

  async update(
    id: string,
    input: GoalInput,
    userId: string,
  ): Promise<Goal | undefined> {
    // mode에 따라 visibility, autoApprove 기본값 결정
    let visibility: string | undefined = undefined;
    let autoApprove: boolean | undefined = undefined;
    const mode = input.mode ? input.mode.toLowerCase() : undefined;
    if (mode === 'personal') {
      visibility = 'private';
      autoApprove = true;
    } else if (mode === 'competition') {
      visibility = 'public';
      autoApprove = false;
    } else if (mode === 'challenger_recruitment') {
      visibility = 'followers';
      autoApprove = false;
    }
    // 입력값이 있으면 우선 적용
    if (input.visibility) visibility = input.visibility.toLowerCase();
    if (typeof input.autoApprove === 'boolean') autoApprove = input.autoApprove;

    const updateData: Record<string, any> = {
      title: input.title,
      description: input.description,
      stickerCount: input.stickerCount,
      mode: input.mode ? input.mode.toLowerCase() : undefined,
      visibility,
      autoApprove,
      status: input.status || undefined,
      updatedBy: userId,
    };
    // undefined 값 제거
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const g = await this.goalModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!g) return undefined;
    return {
      id: g._id ? g._id.toString() : '',
      goalId: g.goalId,
      title: g.title,
      description: g.description,
      stickerCount: g.stickerCount,
      mode: g.mode,
      visibility: g.visibility,
      status: g.status,
      createdBy: g.createdBy,
      autoApprove: g.autoApprove,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      participants:
        g.participants?.map((p) => ({
          userId: p.userId,
          status: p.status,
          currentStickerCount: p.currentStickerCount,
          joinedAt: p.joinedAt,
        })) || [],
    };
  }

  async remove(id: string, userId: string): Promise<boolean> {
    // 필요하다면 삭제 전 updatedBy를 기록할 수 있음
    const g = await this.goalModel.findByIdAndUpdate(
      id,
      { updatedBy: userId },
      { new: true },
    );
    if (!g) return false;
    const res = await this.goalModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
