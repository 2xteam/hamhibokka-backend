import { Injectable } from '@nestjs/common';
import { UserInput } from './dto/user.input';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(input: UserInput): User {
    const user: User = {
      id: uuidv4(),
      email: input.email,
      nickname: input.nickname,
      profileImage: input.profileImage,
    };
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  update(id: string, input: UserInput): User | undefined {
    const user = this.findOne(id);
    if (user) {
      user.email = input.email;
      user.nickname = input.nickname;
      user.profileImage = input.profileImage;
    }
    return user;
  }

  remove(id: string): boolean {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx >= 0) {
      this.users.splice(idx, 1);
      return true;
    }
    return false;
  }
} 