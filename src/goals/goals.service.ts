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
      goalImage: input.goalImage, // 추가됨
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
        let profileImage: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(participant.userId);
          nickname = user?.nickname;
          profileImage = user?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching nickname for user ${participant.userId}:`,
            error,
          );
        }

        participantsWithNicknames.push({
          userId: participant.userId,
          nickname,
          profileImage,
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
      goalImage: saved.goalImage, // 추가됨
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
            let profileImage: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
              profileImage = user?.profileImage;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              profileImage,
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
          goalImage: g.goalImage,
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
            let profileImage: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
              profileImage = user?.profileImage;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              profileImage,
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
          goalImage: g.goalImage,
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

  async findAllGoalsByUserId(userId: string): Promise<Goal[]> {
    // 현재 사용자가 생성한 목표와 참여한 목표 모두 조회
    const goals = await this.goalModel
      .find({
        $or: [
          { createdBy: userId }, // 내가 생성한 목표
          { 'participants.userId': userId }, // 내가 참여한 목표
        ],
      })
      .sort({ createdAt: -1 });

    // 각 goal의 participants에 nickname 조회
    const goalsWithNicknames = await Promise.all(
      goals.map(async (g) => {
        // creator의 nickname 조회
        let creatorNickname: string | undefined = undefined;
        let creatorProfileImage: string | undefined = undefined;
        if (g.createdBy) {
          try {
            const creator = await this.usersService.findByUserId(g.createdBy);
            creatorNickname = creator?.nickname;
            creatorProfileImage = creator?.profileImage;
          } catch (error) {
            console.error('Error fetching creator nickname:', error);
          }
        }

        const participantsWithNicknames = await Promise.all(
          (g.participants || []).map(async (p) => {
            let nickname: string | undefined = undefined;
            let profileImage: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
              profileImage = user?.profileImage;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              profileImage,
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
          creatorNickname,
          creatorProfileImage,
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
            let profileImage: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
              profileImage = user?.profileImage;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              profileImage,
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
          goalImage: g.goalImage,
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
            let profileImage: string | undefined = undefined;
            try {
              const user = await this.usersService.findByUserId(p.userId);
              nickname = user?.nickname;
              profileImage = user?.profileImage;
            } catch (error) {
              console.error(
                `Error fetching nickname for user ${p.userId}:`,
                error,
              );
            }

            return {
              userId: p.userId,
              nickname,
              profileImage,
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
          goalImage: g.goalImage,
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
    let creatorProfileImage: string | undefined = undefined;
    if (g.createdBy) {
      try {
        const creator = await this.usersService.findByUserId(g.createdBy);
        creatorNickname = creator?.nickname;
        creatorProfileImage = creator?.profileImage;
      } catch (error) {
        console.error('Error fetching creator nickname:', error);
      }
    }

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (g.participants) {
      for (const participant of g.participants) {
        let nickname: string | undefined = undefined;
        let profileImage: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(participant.userId);
          nickname = user?.nickname;
          profileImage = user?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching nickname for user ${participant.userId}:`,
            error,
          );
        }

        participantsWithNicknames.push({
          userId: participant.userId,
          nickname,
          profileImage,
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
      goalImage: g.goalImage,
      stickerCount: g.stickerCount,
      mode: g.mode,
      visibility: g.visibility,
      status: g.status,
      createdBy: g.createdBy,
      creatorNickname,
      creatorProfileImage,
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
      goalImage: input.goalImage, // 추가됨
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
        let profileImage: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(participant.userId);
          nickname = user?.nickname;
          profileImage = user?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching nickname for user ${participant.userId}:`,
            error,
          );
        }

        participantsWithNicknames.push({
          userId: participant.userId,
          nickname,
          profileImage,
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
      goalImage: g.goalImage,
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
    const g = await this.goalModel.findOne({
      _id: id,
      createdBy: userId,
    });
    if (!g) return false;
    const res = await this.goalModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  async receiveSticker(
    goalId: string,
    toUserId: string,
    stickerCount: number,
    userId: string,
  ): Promise<Goal> {
    // 목표 찾기
    const goal = await this.goalModel.findOne({ goalId });
    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다.');
    }

    // 참여자 목록에서 해당 사용자 찾기
    const participant = goal.participants?.find((p) => p.userId === toUserId);

    if (!participant) {
      throw new Error('해당 사용자가 이 목표에 참여하고 있지 않습니다.');
    }

    // 스티커 카운트 증가
    participant.currentStickerCount += stickerCount;

    // 스티커 받은 로그 추가
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정

    // 오늘 날짜의 로그가 있는지 확인
    const existingLogIndex = participant.stickerReceivedLogs?.findIndex(
      (log) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      },
    );

    if (existingLogIndex !== undefined && existingLogIndex !== -1) {
      // 기존 로그가 있으면 카운트 증가
      participant.stickerReceivedLogs[existingLogIndex].count += 1;
    } else {
      // 새로운 로그 추가
      if (!participant.stickerReceivedLogs) {
        participant.stickerReceivedLogs = [];
      }
      participant.stickerReceivedLogs.push({
        date: today,
        count: 1,
      });
    }

    goal.markModified('participants');
    goal.updatedBy = userId;
    await goal.save();

    // creator의 nickname 조회
    let creatorNickname: string | undefined = undefined;
    let creatorProfileImage: string | undefined = undefined;
    if (goal.createdBy) {
      try {
        const creator = await this.usersService.findByUserId(goal.createdBy);
        creatorNickname = creator?.nickname;
        creatorProfileImage = creator?.profileImage;
      } catch (error) {
        console.error('Error fetching creator nickname:', error);
      }
    }

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (goal.participants) {
      for (const p of goal.participants) {
        let nickname: string | undefined = undefined;
        let profileImage: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(p.userId);
          nickname = user?.nickname;
          profileImage = user?.profileImage;
        } catch (error) {
          console.error(`Error fetching nickname for user ${p.userId}:`, error);
        }

        participantsWithNicknames.push({
          userId: p.userId,
          nickname,
          profileImage,
          status: p.status,
          currentStickerCount: p.currentStickerCount,
          joinedAt: p.joinedAt,
          stickerReceivedLogs: p.stickerReceivedLogs || [],
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
      creatorProfileImage,
      autoApprove: goal.autoApprove,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      participants: participantsWithNicknames,
    };
  }

  async leaveGoal(
    goalId: string,
    participantId: string,
    userId: string,
  ): Promise<Goal> {
    // 목표 찾기
    const goal = await this.goalModel.findOne({ goalId });
    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다.');
    }

    // 참여자 목록에서 해당 사용자 찾기
    const participantIndex = goal.participants?.findIndex(
      (p) => p.userId === participantId,
    );

    if (participantIndex === -1 || participantIndex === undefined) {
      throw new Error('해당 사용자가 이 목표에 참여하고 있지 않습니다.');
    }

    // 참여자 제거
    goal.participants.splice(participantIndex, 1);
    goal.markModified('participants');
    goal.updatedBy = userId;
    await goal.save();

    // creator의 nickname 조회
    let creatorNickname: string | undefined = undefined;
    let creatorProfileImage: string | undefined = undefined;
    if (goal.createdBy) {
      try {
        const creator = await this.usersService.findByUserId(goal.createdBy);
        creatorNickname = creator?.nickname;
        creatorProfileImage = creator?.profileImage;
      } catch (error) {
        console.error('Error fetching creator nickname:', error);
      }
    }

    // participants의 nickname 조회
    const participantsWithNicknames: any[] = [];
    if (goal.participants) {
      for (const participant of goal.participants) {
        let nickname: string | undefined = undefined;
        let profileImage: string | undefined = undefined;
        try {
          const user = await this.usersService.findByUserId(participant.userId);
          nickname = user?.nickname;
          profileImage = user?.profileImage;
        } catch (error) {
          console.error(
            `Error fetching nickname for user ${participant.userId}:`,
            error,
          );
        }

        participantsWithNicknames.push({
          userId: participant.userId,
          nickname,
          profileImage,
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
      creatorProfileImage,
      autoApprove: goal.autoApprove,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      participants: participantsWithNicknames,
    };
  }
}
