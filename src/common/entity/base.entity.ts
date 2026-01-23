import { ApiProperty } from '@nestjs/swagger';

export class BaseEntity {
  @ApiProperty({
    example: 'ckv1z8h3a0000qzrmn6j4v6v9',
    description: 'Unique identifier for the entity',
  })
  id: string;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the entity is deleted',
    default: false,
  })
  isDeleted: boolean = false;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the entity was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Timestamp when the entity was last updated',
  })
  updatedAt: Date;
}
