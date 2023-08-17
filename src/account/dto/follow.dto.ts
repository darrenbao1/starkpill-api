import { IsHexadecimal } from 'class-validator';

export class FollowDto {
  @IsHexadecimal()
  walletAddress: string;
}
