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
    // mode에 따라 visibility, autoApprove, participants 기본값 결정
    let visibility: string | undefined = undefined;
    let autoApprove: boolean | undefined = undefined;
    let participants: any[] = [];
    const mode = input.mode ? input.mode.toLowerCase() : 'personal';
    if (mode === 'personal') {
      visibility = 'private';
      autoApprove = true;
      participants = [
        {
          userId: userId,
          currentStickerCount: 0,
        },
      ];
    } else if (mode === 'competition') {
      visibility = 'public';
      autoApprove = false;
      participants = [];
    } else if (mode === 'challenger_recruitment') {
      visibility = 'followers';
      autoApprove = false;
      participants = [];
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
      participants,
    };
    const goal = new this.goalModel(goalData);
    const saved = await goal.save();

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (saved.participants) {
      for (const participant of saved.participants) {
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
          stickerReceivedLogs: participant.stickerReceivedLogs || [],
        });
      }
    }

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
      participants: participantsWithNicknames,
    };
  }

  async findAll(userId?: string): Promise<Goal[]> {
    let goals = await this.goalModel.find().sort({ createdAt: -1 });

    // userId가 제공된 경우 현재 사용자가 생성한 goal만 조회
    if (userId) {
      goals = goals.filter((goal) => goal.createdBy === userId);
    }

    // 각 goal의 participants에 nickname 조회
    const goalsWithNicknames = await Promise.all(
      goals.map(async (g) => {
        const participantsWithNicknames = await Promise.all(
          (g.participants || []).map(async (p) => {
            let nickname: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              status: p.status,
              currentStickerCount: p.currentStickerCount,
              joinedAt: p.joinedAt,
              stickerReceivedLogs: p.stickerReceivedLogs || [],
            };
          }),
        );

        return {
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
          participants: participantsWithNicknames,
        };
      }),
    );

    return goalsWithNicknames;
  }

  async findMyParticipatedGoals(userId: string): Promise<Goal[]> {
    // 현재 사용자가 참여한 goals만 조회 (생성한 goals는 제외)
    const goals = await this.goalModel
      .find({
        'participants.userId': userId,
        createdBy: { $ne: userId }, // 내가 생성한 goals는 제외
      })
      .sort({ createdAt: -1 });

    // 각 goal의 participants에 nickname 조회
    const goalsWithNicknames = await Promise.all(
      goals.map(async (g) => {
        const participantsWithNicknames = await Promise.all(
          (g.participants || []).map(async (p) => {
            let nickname: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              status: p.status,
              currentStickerCount: p.currentStickerCount,
              joinedAt: p.joinedAt,
              stickerReceivedLogs: p.stickerReceivedLogs || [],
            };
          }),
        );

        return {
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
          participants: participantsWithNicknames,
        };
      }),
    );

    return goalsWithNicknames;
  }

  async findFollowedUsersGoals(userId: string): Promise<Goal[]> {
    // 현재 사용자가 팔로우하는 사용자들의 ID 목록 조회
    const followedUsers = await this.followsService.getFollowedUserIds(userId);

    if (followedUsers.length === 0) {
      console.log('No followed users found');
      return [];
    }

    // 팔로우하는 사용자들이 생성한 goals 조회 (challenger_recruitment 모드만)
    const goals = await this.goalModel
      .find({
        createdBy: { $in: followedUsers },
        mode: 'challenger_recruitment',
      })
      .sort({ createdAt: -1 });

    // visibility에 따른 필터링 적용
    const filteredGoals: typeof goals = [];
    for (const goal of goals) {
      // PUBLIC인 경우 모든 사용자가 볼 수 있음
      if (goal.visibility === GoalVisibility.PUBLIC) {
        filteredGoals.push(goal);
        continue;
      }

      // PRIVATE인 경우 조회 제외
      if (goal.visibility === GoalVisibility.PRIVATE) {
        continue;
      }

      // FOLLOWERS인 경우 맞팔로우 상태일 때만 조회
      if (goal.visibility === GoalVisibility.FOLLOWERS) {
        // Goal 생성자를 팔로우하고 있는지 확인 (양방향 중 하나라도 approved 상태이면 true)
        const isFollowing = await this.followsService.isFollowing(
          userId,
          goal.createdBy,
        );

        if (isFollowing) {
          filteredGoals.push(goal);
        }
        continue;
      }
    }

    // 각 goal의 participants에 nickname 조회
    const goalsWithNicknames = await Promise.all(
      filteredGoals.map(async (g) => {
        const participantsWithNicknames = await Promise.all(
          (g.participants || []).map(async (p) => {
            let nickname: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              status: p.status,
              currentStickerCount: p.currentStickerCount,
              joinedAt: p.joinedAt,
              stickerReceivedLogs: p.stickerReceivedLogs || [],
            };
          }),
        );

        return {
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
          participants: participantsWithNicknames,
        };
      }),
    );

    return goalsWithNicknames;
  }

  async searchGoalsByTitle(title: string, userId?: string): Promise<Goal[]> {
    let goals = await this.goalModel
      .find({
        title: { $regex: title, $options: 'i' },
      })
      .sort({ createdAt: -1 });

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

    // 각 goal의 participants에 nickname 조회
    const goalsWithNicknames = await Promise.all(
      goals.map(async (g) => {
        const participantsWithNicknames = await Promise.all(
          (g.participants || []).map(async (p) => {
            let nickname: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              status: p.status,
              currentStickerCount: p.currentStickerCount,
              joinedAt: p.joinedAt,
              stickerReceivedLogs: p.stickerReceivedLogs || [],
            };
          }),
        );

        return {
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
          participants: participantsWithNicknames,
        };
      }),
    );

    return goalsWithNicknames;
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
          stickerReceivedLogs: participant.stickerReceivedLogs || [],
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
          stickerReceivedLogs: participant.stickerReceivedLogs || [],
        });
      }
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
      autoApprove: g.autoApprove,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      participants: participantsWithNicknames,
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

  async receiveSticker(
    goalId: string,
    toUserId: string,
    userId: string,
    stickerCount?: number,
  ): Promise<Goal> {
    // toUserId를 recipientId로 매핑
    const recipientId = toUserId;
    // Goal이 존재하는지 확인
    const goal = await this.goalModel.findOne({ goalId });
    if (!goal) {
      throw new Error('Goal을 찾을 수 없습니다.');
    }

    // stickerCount 파라미터 처리 (없으면 1)
    const count = stickerCount && stickerCount > 0 ? stickerCount : 1;
    const nowDate = new Date();

    // participants 배열에서 해당 사용자의 정보를 업데이트 (매번 새로운 로그 추가)
    goal.participants = [...(goal.participants || [])].map((p) => {
      if (p.userId === recipientId) {
        const logs = Array.isArray(p.stickerReceivedLogs)
          ? [...p.stickerReceivedLogs]
          : [];
        // stickerCount만큼 반복 push하는 대신, count: stickerCount로 한 번만 push
        logs.push({ date: nowDate, count });
        return {
          userId: p.userId,
          status: p.status || 'active',
          currentStickerCount: (p.currentStickerCount || 0) + count,
          joinedAt: p.joinedAt || new Date(),
          stickerReceivedLogs: logs,
        };
      }
      return {
        userId: p.userId,
        status: p.status || 'active',
        currentStickerCount: p.currentStickerCount || 0,
        joinedAt: p.joinedAt || new Date(),
        stickerReceivedLogs: Array.isArray(p.stickerReceivedLogs)
          ? p.stickerReceivedLogs
          : [],
      };
    });

    goal.markModified('participants');
    goal.updatedBy = userId;
    await goal.save();

    // creator의 nickname 조회
    let creatorNickname: string | undefined = undefined;
    if (goal.createdBy) {
      try {
        const creator = await this.usersService.findByUserId(goal.createdBy);
        creatorNickname = creator?.nickname;
      } catch (error) {
        console.error('Error fetching creator nickname:', error);
      }
    }

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (goal.participants) {
      for (const participant of goal.participants) {
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
          stickerReceivedLogs: participant.stickerReceivedLogs || [],
        });
      }
    }

    return {
      id: goal._id ? goal._id.toString() : '',
      goalId: goal.goalId,
      title: goal.title,
      description: goal.description,
      stickerCount: goal.stickerCount,
      mode: goal.mode,
      visibility: goal.visibility,
      status: goal.status,
      createdBy: goal.createdBy,
      creatorNickname,
      autoApprove: goal.autoApprove,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      participants: participantsWithNicknames,
    };
  }
}
