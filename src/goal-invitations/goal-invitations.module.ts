import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GoalInvitation,
  GoalInvitationSchema,
} from '../schemas/goal-invitation.schema';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { UsersModule } from '../users/users.module';
import { GoalInvitationsResolver } from './goal-invitations.resolver';
import { GoalInvitationsService } from './goal-invitations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoalInvitation.name, schema: GoalInvitationSchema },
      { name: Goal.name, schema: GoalSchema },
    ]),
    UsersModule,
  ],
  providers: [GoalInvitationsResolver, GoalInvitationsService],
  exports: [GoalInvitationsService],
})
export class GoalInvitationsModule {}
