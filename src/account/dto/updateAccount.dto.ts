import {
  IsEmail,
  IsString,
  IsOptional,
  IsHexadecimal,
  Length,
  IsNumber,
} from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160, { message: 'Bio must be between 0 and 160 characters' })
  bio?: string;

  @IsOptional()
  @IsNumber()
  profilePictureTokenId?: number;

  @IsOptional()
  @IsNumber()
  coverPictureTokenId?: number;

  @IsOptional()
  @IsString()
  ensDomain?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50, { message: 'Location must be between 0 and 50 characters' })
  location?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;
}
