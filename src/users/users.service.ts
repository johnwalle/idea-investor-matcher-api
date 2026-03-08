// src/modules/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: QueryUsersDto) {
    return this.prisma.user.findMany({
      where: {
        role: query.role,
        isActive: query.isActive,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }


  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id); // ensure exists

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  // src/modules/users/users.service.ts (add these two methods)

async updateFullName(id: string, fullName: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return this.prisma.user.update({
    where: { id },
    data: { fullName },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      createdAt: true,
    },
  });
}

async updateProfilePic(id: string, profilePicUrl: string, profilePicId: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return this.prisma.user.update({
    where: { id },
    data: {
      profilePic: profilePicUrl,
      profilePicId: profilePicId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      createdAt: true,
    },
  });
}

}
