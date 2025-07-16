import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Follow {
  @Field(() => ID)
  id: string;

  @Field()
  followerId: string;

  @Field()
  followingId: string;

  @Field({ nullable: true })
  followerNickname?: string;

  @Field({ nullable: true })
  followingNickname?: string;

  @Field({ nullable: true })
  followerEmail?: string;

  @Field({ nullable: true })
  followerProfileImage?: string;

  @Field({ nullable: true })
  followingEmail?: string;

  @Field({ nullable: true })
  followingProfileImage?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
