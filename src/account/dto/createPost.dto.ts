import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  isString,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true }) // Ensure each element is a valid URL
  gifUrls: string[]; // Array of GIF URLs
}
