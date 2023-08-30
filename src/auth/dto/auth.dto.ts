import { IsHexadecimal } from 'class-validator';

export class AuthDto {
  @IsHexadecimal()
  walletAddress: string;
}
