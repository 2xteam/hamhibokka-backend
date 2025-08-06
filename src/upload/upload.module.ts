import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GoalsModule } from '../goals/goals.module';
import { UsersModule } from '../users/users.module';
import { AzureUploadService } from './azure-upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => GoalsModule),
    JwtModule,
  ],
  providers: [AzureUploadService],
  controllers: [UploadController],
  exports: [AzureUploadService],
})
export class UploadModule {}
