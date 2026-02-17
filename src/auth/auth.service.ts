import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthProvider } from '../common/enums/provider.enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ------------------------------
  // REGISTER (LOCAL SIGNUP)
  // ------------------------------
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // If user exists and is verified → conflict
    if (existing && existing.emailVerified)
      throw new ConflictException('Email already exists');

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existing && !existing.emailVerified) {
      // User exists but not verified → update OTP & password
      await this.prisma.user.update({
        where: { email: dto.email },
        data: {
          passwordHash,
          role: dto.role,
          otpHash,
          otpExpiresAt: expiry,
        },
      });
    } else {
      // New user → create
      await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          role: dto.role,
          provider: AuthProvider.LOCAL,
          otpHash,
          otpExpiresAt: expiry,
        },
      });
    }

    // Send OTP
    await this.mailService.sendOTP(dto.email, otp);

    return { message: 'Registration successful, please verify your email' };
  }

  // ------------------------------
  // VERIFY EMAIL
  // ------------------------------
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.otpHash)
      throw new UnauthorizedException('Invalid request');

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
      throw new ForbiddenException('OTP expired');

    const valid = await bcrypt.compare(dto.otp, user.otpHash);

    if (!valid) throw new UnauthorizedException('Invalid OTP');

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        emailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // ------------------------------
  // RESEND OTP
  // ------------------------------
  async resendOTP(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified)
      throw new BadRequestException('Email already verified');

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { otpHash, otpExpiresAt: expiry },
    });

    await this.mailService.sendOTP(dto.email, otp);

    return { message: 'A new OTP has been sent to your email' };
  }

  // ------------------------------
  // LOGIN (LOCAL)
  // ------------------------------
  async login(dto: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (!user || user.provider !== AuthProvider.LOCAL)
    throw new UnauthorizedException('Invalid credentials');

  if (!user.emailVerified)
    throw new ForbiddenException('Email not verified');

  const valid = await bcrypt.compare(dto.password, user.passwordHash!);

  if (!valid) throw new UnauthorizedException('Invalid credentials');

  const tokens = await this.generateTokens(user);

  await this.updateRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  };
}


private async generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    }),
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}



// ------------------------------
// UPDATE REFRESH TOKEN

private async updateRefreshToken(userId: string, refreshToken: string) {
  const hashed = await bcrypt.hash(refreshToken, 10);

  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshToken: hashed },
  });
}


// ------------------------------
// REFRESH TOKENS
async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });


  if (!user || !user.refreshToken)
    throw new ForbiddenException('Access denied');

  const valid = await bcrypt.compare(refreshToken, user.refreshToken);

  if (!valid) throw new ForbiddenException('Access denied');

  const tokens = await this.generateTokens(user);

  await this.updateRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  };
}

// ------------------------------
// LOGOUT
async logout(userId: string) {
  await this.prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  return { message: 'Logged out successfully' };
}

}
