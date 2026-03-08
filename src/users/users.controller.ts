// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateFullNameDto } from './dto/update-fullname.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  // update full name only
  @Patch(':id/update-name')
  updateFullName(@Param('id') id: string, @Body() body: UpdateFullNameDto) {
    return this.usersService.updateFullName(id, body.fullName);
  }

  // upload profile pic only
  @Patch(':id/complete-profile')
  @UseInterceptors(
    FileInterceptor('profilePic', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Only image files are allowed (jpg, png, webp)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePic(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    const uploadResult = await this.cloudinaryService.uploadProfilePic(file);

    return this.usersService.updateProfilePic(
      id,
      uploadResult.url,
      uploadResult.publicId,
    );
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}