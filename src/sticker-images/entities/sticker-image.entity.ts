import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class StickerImage {
  @Field(() => ID)
  id: string;

  @Field()
  stickerImageId: string;

  @Field()
  name: string;

  @Field()
  imageUrl: string;

  @Field()
  thumbnailUrl: string;

  @Field()
  isDefault: boolean;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  uploadedBy?: string;

  @Field()
  createdAt: Date;
}