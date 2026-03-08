import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  constructor() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error('Cloudinary environment variables are missing');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadPitchDeck(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    if (!file.buffer) {
      throw new InternalServerErrorException('Invalid file buffer');
    }

    try {
      const result: UploadApiResponse = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'idea-investor-matcher/pitch-decks',
                resource_type: 'raw',
              },
              (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload failed'));
                resolve(result);
              },
            )
            .end(file.buffer);
        },
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new InternalServerErrorException('Failed to upload pitch deck');
    }
  }

  async uploadProfilePic(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    if (!file.buffer) {
      throw new InternalServerErrorException('Invalid file buffer');
    }

    try {
      const result: UploadApiResponse = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'idea-investor-matcher/profile-pics',
                resource_type: 'image',
                transformation: [
                  { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                ],
              },
              (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload failed'));
                resolve(result);
              },
            )
            .end(file.buffer);
        },
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new InternalServerErrorException('Failed to upload profile picture');
    }
  }

  async deleteFile(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete file from Cloudinary',
      );
    }
  }
}