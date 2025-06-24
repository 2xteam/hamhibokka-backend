import { Injectable } from '@nestjs/common';
import { GoalInput } from './dto/goal.input';
import { Goal } from './entities/goal.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoalsService {
  private goals: Goal[] = [];

  create(input: GoalInput): Goal {
    const goal: Goal = {
      id: uuidv4(),
      title: input.title,
      description: input.description,
    };
    this.goals.push(goal);
    return goal;
  }

  findAll(): Goal[] {
    return this.goals;
  }

  findOne(id: string): Goal | undefined {
    return this.goals.find(g => g.id === id);
  }

  update(id: string, input: GoalInput): Goal | undefined {
    const goal = this.findOne(id);
    if (goal) {
      goal.title = input.title;
      goal.description = input.description;
    }
    return goal;
  }

  remove(id: string): boolean {
    const idx = this.goals.findIndex(g => g.id === id);
    if (idx >= 0) {
      this.goals.splice(idx, 1);
      return true;
    }
    return false;
  }
} 