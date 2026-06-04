import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';
import { User } from '../../generated/browser';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUserByRegister(dto: RegisterDto, passwordHash: string) {
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          gender: dto.gender,
          passwordHash,
        },
      });
      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
