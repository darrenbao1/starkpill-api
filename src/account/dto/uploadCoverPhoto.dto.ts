import { IsNotEmpty, IsNumber } from 'class-validator';

export class UploadCoverPhotoDto {
  @IsNotEmpty()
  @IsNumber()
  xPos: number;

  @IsNotEmpty()
  @IsNumber()
  yPos: number;
}
