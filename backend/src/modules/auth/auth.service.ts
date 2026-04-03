import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../common/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationId: string,
    role: string = 'developer',
  ) {
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organizationId,
      role,
      projectIds: [],
      isActive: true,
    });

    const savedUser = await user.save();
    return this.generateTokenResponse(savedUser);
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenResponse(user);
  }

  async validateUser(payload: any) {
    const user = await this.userModel.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: any) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { firstName: updateData.firstName, lastName: updateData.lastName, preferences: updateData.preferences },
      { new: true },
    ).select('-password');

    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async validateApiKey(apiKey: string) {
    // API Key validation for SDK authentication
    // In production, store API keys securely and hash them
    if (!apiKey || apiKey.length < 20) {
      throw new UnauthorizedException('Invalid API key');
    }
    return { valid: true, apiKey };
  }

  async validateJwt(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private generateTokenResponse(user: any) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      projectIds: user.projectIds,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '24h' }),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        projectIds: user.projectIds,
      },
      expiresIn: '24h',
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
