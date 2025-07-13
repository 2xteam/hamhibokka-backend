import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GoalInvitation,
  GoalInvitationDocument,
  InvitationStatus,
  InvitationType,
} from '../schemas/goal-invitation.schema';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import {
  CreateGoalInvitationInput,
  CreateGoalJoinRequestInput,
  UpdateGoalInvitationInput,
} from './dto/goal-invitation.input';
import { GoalInvitation as GoalInvitationEntity } from './entities/goal-invitation.entity';

@Injectable()
export class GoalInvitationsService {
  constructor(
    @InjectModel(GoalInvitation.name)
    private readonly invitationModel: Model<GoalInvitationDocument>,
    @InjectModel(Goal.name)
    private readonly goalModel: Model<GoalDocument>,
  ) {}

  async create(
    input: CreateGoalInvitationInput,
    userId: string,
  ): Promise<GoalInvitationEntity> {
    // Goal이 존재하는지 확인
    const goal = await this.goalModel.findOne({ goalId: input.goalId });
    if (!goal) {
      throw new NotFoundException('Goal을 찾을 수 없습니다.');
    }

    // Goal 생성자만 초대할 수 있음
    if (goal.createdBy !== userId) {
      throw new BadRequestException('Goal 생성자만 초대할 수 있습니다.');
    }

    // 초대받을 사용자가 이미 참여하고 있는지 확인
    const isAlreadyParticipant = goal.participants?.some(
      (p) => p.userId === input.toUserId,
    );
    if (isAlreadyParticipant) {
      throw new BadRequestException('이미 Goal에 참여하고 있는 사용자입니다.');
    }

    // 이미 초대/요청이 있는지 확인
    const existingInvitation = await this.invitationModel.findOne({
      goalId: input.goalId,
      fromUserId: userId,
      toUserId: input.toUserId,
      status: { $in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
    });

    if (existingInvitation) {
      throw new BadRequestException('이미 초대/요청이 존재합니다.');
    }

    const invitation = new this.invitationModel({
      invitationId: `invitation_${Math.random().toString(36).substr(2, 9)}`,
      goalId: input.goalId,
      fromUserId: userId,
      toUserId: input.toUserId,
      type: input.type as InvitationType,
      message: input.message,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await invitation.save();
    return this.mapToEntity(saved);
  }

  async createJoinRequest(
    input: CreateGoalJoinRequestInput,
    userId: string,
  ): Promise<GoalInvitationEntity> {
    // Goal이 존재하는지 확인
    const goal = await this.goalModel.findOne({ goalId: input.goalId });
    if (!goal) {
      throw new NotFoundException('Goal을 찾을 수 없습니다.');
    }

    // 참여자가 이미 Goal에 참여하고 있는지 확인
    const isAlreadyParticipant = goal.participants?.some(
      (p) => p.userId === userId,
    );
    if (isAlreadyParticipant) {
      throw new BadRequestException('이미 Goal에 참여하고 있습니다.');
    }

    // 이미 요청이 있는지 확인
    const existingInvitation = await this.invitationModel.findOne({
      goalId: input.goalId,
      fromUserId: userId,
      toUserId: goal.createdBy,
      status: {
        $in: [
          InvitationStatus.PENDING,
          InvitationStatus.ACCEPTED,
          InvitationStatus.REJECTED,
        ],
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.PENDING) {
        throw new BadRequestException(
          '이미 참가 요청을 보냈습니다. 요청이 대기 중입니다.',
        );
      } else if (existingInvitation.status === InvitationStatus.ACCEPTED) {
        throw new BadRequestException('이미 참가 요청이 수락되었습니다.');
      } else if (existingInvitation.status === InvitationStatus.REJECTED) {
        throw new BadRequestException(
          '이미 참가 요청이 거절되었습니다. 새로운 요청을 보낼 수 없습니다.',
        );
      }
      throw new BadRequestException('이미 참가 요청을 보냈습니다.');
    }

    const invitation = new this.invitationModel({
      invitationId: `invitation_${Math.random().toString(36).substr(2, 9)}`,
      goalId: input.goalId,
      fromUserId: userId, // 요청을 보내는 참여자
      toUserId: goal.createdBy, // Goal 생성자
      type: InvitationType.REQUEST, // 항상 'request' 타입
      message: input.message,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await invitation.save();
    return this.mapToEntity(saved);
  }

  async findAll(userId: string): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  async findReceivedInvitations(
    userId: string,
  ): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        toUserId: userId,
        status: InvitationStatus.PENDING,
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  async findSentInvitations(userId: string): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        fromUserId: userId,
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  // 특정 Goal의 초대/요청 조회
  async findInvitationsByGoalId(
    goalId: string,
    userId: string,
  ): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        goalId,
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  // 받은 초대만 조회 (Goal 생성자가 받은 참여 요청들)
  async findReceivedInvites(userId: string): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        toUserId: userId,
        type: InvitationType.REQUEST, // 참여 요청만
        status: InvitationStatus.PENDING,
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  // 보낸 초대만 조회 (Goal 생성자가 보낸 초대들)
  async findSentInvites(userId: string): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        fromUserId: userId,
        type: InvitationType.INVITE, // 초대만
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  // 보낸 요청만 조회 (참여자가 보낸 참여 요청들)
  async findSentRequests(userId: string): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        fromUserId: userId,
        type: InvitationType.REQUEST, // 요청만
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  // 특정 상태의 초대/요청 조회
  async findInvitationsByStatus(
    userId: string,
    status: InvitationStatus,
  ): Promise<GoalInvitationEntity[]> {
    const invitations = await this.invitationModel
      .find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status,
      })
      .sort({ createdAt: -1 });

    // 각 invitation에 대해 goal 정보를 조회하여 포함
    const invitationsWithGoalInfo = await Promise.all(
      invitations.map(async (invitation) => {
        const goal = await this.goalModel.findOne({
          goalId: invitation.goalId,
        });
        return this.mapToEntityWithGoalInfo(invitation, goal);
      }),
    );

    return invitationsWithGoalInfo;
  }

  async findOne(id: string): Promise<GoalInvitationEntity | undefined> {
    const invitation = await this.invitationModel.findById(id);
    if (!invitation) return undefined;

    // goal 정보 조회
    const goal = await this.goalModel.findOne({ goalId: invitation.goalId });
    return this.mapToEntityWithGoalInfo(invitation, goal);
  }

  async update(
    id: string,
    input: UpdateGoalInvitationInput,
    userId: string,
  ): Promise<GoalInvitationEntity | undefined> {
    const invitation = await this.invitationModel.findById(id);
    if (!invitation) {
      throw new NotFoundException('초대/요청을 찾을 수 없습니다.');
    }

    // 권한 확인: 받은 사람만 응답할 수 있음
    if (invitation.toUserId !== userId) {
      throw new BadRequestException('응답 권한이 없습니다.');
    }

    const updated = await this.invitationModel.findByIdAndUpdate(
      id,
      {
        status: input.status as InvitationStatus,
        message: input.message,
        respondedAt: new Date(),
        updatedBy: userId,
      },
      { new: true },
    );

    if (!updated) return undefined;

    // 초대/요청이 수락되면 Goal의 participants에 추가
    if (input.status === 'accepted') {
      await this.addParticipantToGoal(invitation.goalId, userId);
    }

    // goal 정보 조회
    const goal = await this.goalModel.findOne({ goalId: updated.goalId });
    return this.mapToEntityWithGoalInfo(updated, goal);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const invitation = await this.invitationModel.findById(id);
    if (!invitation) return false;

    // 권한 확인: 보낸 사람만 취소할 수 있음
    if (invitation.fromUserId !== userId) {
      throw new BadRequestException('취소 권한이 없습니다.');
    }

    const res = await this.invitationModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }

  private async addParticipantToGoal(
    goalId: string,
    userId: string,
  ): Promise<void> {
    await this.goalModel.updateOne(
      { goalId },
      {
        $push: {
          participants: {
            userId,
            currentStickerCount: 0,
          },
        },
      },
    );
  }

  private mapToEntity(
    invitation: GoalInvitationDocument,
  ): GoalInvitationEntity {
    return {
      id: invitation._id ? String(invitation._id) : '',
      invitationId: invitation.invitationId || '',
      goalId: invitation.goalId,
      fromUserId: invitation.fromUserId,
      toUserId: invitation.toUserId,
      type: invitation.type,
      status: invitation.status,
      message: invitation.message,
      respondedAt: invitation.respondedAt,
      createdAt: invitation.createdAt || new Date(),
      updatedAt: invitation.updatedAt || new Date(),
    };
  }

  private mapToEntityWithGoalInfo(
    invitation: GoalInvitationDocument,
    goal: GoalDocument | null,
  ): GoalInvitationEntity {
    const baseEntity = this.mapToEntity(invitation);

    // Goal 엔티티로 변환
    const goalEntity = goal
      ? {
          id: goal._id ? String(goal._id) : '',
          goalId: goal.goalId,
          title: goal.title,
          description: goal.description,
          stickerCount: goal.stickerCount,
          mode: goal.mode,
          visibility: goal.visibility,
          status: goal.status,
          createdBy: goal.createdBy,
          autoApprove: goal.autoApprove,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
          participants:
            goal.participants?.map((p) => ({
              userId: p.userId,
              status: p.status,
              currentStickerCount: p.currentStickerCount,
              joinedAt: p.joinedAt,
            })) || [],
        }
      : undefined;

    return {
      ...baseEntity,
      goal: goalEntity,
    };
  }
}
