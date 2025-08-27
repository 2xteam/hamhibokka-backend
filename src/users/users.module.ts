import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { GoalsModule } from '../goals/goals.module';
import { GoalInvitationsModule } from '../goal-invitations/goal-invitations.module';
import { User, UserSchema } from '../schemas/user.schema';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    forwardRef(() => FollowsModule),
    forwardRef(() => GoalsModule),
    forwardRef(() => GoalInvitationsModule),
  ],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
