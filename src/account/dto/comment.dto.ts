import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CommentDto {
  @IsNotEmpty()
  @IsString()
  @Length(0, 280, { message: 'Comment must be between 0 and 280 characters' })
  text: string;
}
