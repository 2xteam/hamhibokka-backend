import { Injectable } from '@nestjs/common';
import { FollowInput } from './dto/follow.input';
import { Follow } from './entities/follow.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FollowsService {
  private follows: Follow[] = [];

  create(input: FollowInput): Follow {
    const follow: Follow = {
      id: uuidv4(),
      followerId: input.followerId,
      followingId: input.followingId,
    };
    this.follows.push(follow);
    return follow;
  }

  findAll(): Follow[] {
    return this.follows;
  }

  findOne(id: string): Follow | undefined {
    return this.follows.find(f => f.id === id);
  }

  update(id: string, input: FollowInput): Follow | undefined {
    const follow = this.findOne(id);
    if (follow) {
      follow.followerId = input.followerId;
      follow.followingId = input.followingId;
    }
    return follow;
  }

  remove(id: string): boolean {
    const idx = this.follows.findIndex(f => f.id === id);
    if (idx >= 0) {
      this.follows.splice(idx, 1);
      return true;
    }
    return false;
  }
} 