import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { convertToStandardWalletAddress } from 'src/indexing/utils';
import { JwtService } from '@nestjs/jwt';
import * as bycrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  async login(dto: AuthDto) {
    //convert wallet address to standard wallet address
    const walletAddress = convertToStandardWalletAddress(dto.walletAddress);
    //check if user exists in accounts table
    const account = await this.prisma.account.findUnique({
      where: {
        walletAddress: walletAddress,
      },
    });

    if (!account) {
      //generate hash of the wallet address and store in it db.
      const walletAddressHash = await bycrypt.hash(walletAddress, 10);
      //if user does not exist, create a new user in accounts table
      try {
        const newAccount = await this.prisma.account.create({
          data: {
            walletAddress: walletAddress,
            walletAddressHash: walletAddressHash,
          },
        });
        //create a jwt token and return it
        return this.signToken(newAccount.walletAddressHash);
      } catch (error) {
        console.log(error);
        return 'error creating new account';
      }
    } else {
      //if user exists, create a jwt token and return it
      return this.signToken(account.walletAddressHash);
    }
  }

  async signToken(
    walletAddressHash: string,
  ): Promise<{ access_token: string }> {
    //using the hash as the payload as the hash cannot be decoded, and is unique for each user
    //only way to get the hash is to use the wallet address and search our db
    //even if they bycrypt the wallet address on their end, the encryption is different for every run time.
    //payload for jwt token generation
    const payload = {
      sub: walletAddressHash,
    };

    //secret from .env file
    const secret = this.config.get('JWT_TOKEN');

    //create jwt token 1 hour access
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '1h',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
