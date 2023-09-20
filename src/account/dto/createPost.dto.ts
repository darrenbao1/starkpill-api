import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  isString,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @Length(0, 280, { message: 'Post must be between 0 and 280 characters' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true }) // Ensure each element is a valid URL
  gifUrls: string[]; // Array of GIF URLs
}
