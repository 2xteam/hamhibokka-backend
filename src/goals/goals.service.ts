import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal } from './entities/goal.entity';
import { Goal as GoalSchema, GoalDocument } from '../schemas/goal.schema';
import { GoalInput } from './dto/goal.input';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(GoalSchema.name)
    private readonly goalModel: Model<GoalDocument>,
  ) {}

  async create(input: GoalInput): Promise<Goal> {
    const goal = new this.goalModel({
      title: input.title,
      description: input.description,
      // goalId 등 필요한 필드 추가
    });
    const saved = await goal.save();
    return {
      id: saved._id ? String(saved._id) : '',
      title: saved.title,
      description: saved.description,
    };
  }

  async findAll(): Promise<Goal[]> {
    const goals = await this.goalModel.find();
    return goals.map(g => ({
      id: g._id ? String(g._id) : '',
      title: g.title,
      description: g.description,
    }));
  }

  async findOne(id: string): Promise<Goal | undefined> {
    const g = await this.goalModel.findById(id);
    if (!g) return undefined;
    return {
      id: g._id ? String(g._id) : '',
      title: g.title,
      description: g.description,
    };
  }

  async update(id: string, input: GoalInput): Promise<Goal | undefined> {
    const g = await this.goalModel.findByIdAndUpdate(
      id,
      {
        title: input.title,
        description: input.description,
      },
      { new: true },
    );
    if (!g) return undefined;
    return {
      id: g._id ? String(g._id) : '',
      title: g.title,
      description: g.description,
    };
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.goalModel.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
} 