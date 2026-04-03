import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organizationId,
      role,
      projectIds: [],
    });

    const savedUser = await user.save();
    return this.generateTokenResponse(savedUser);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenResponse(user);
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
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        projectIds: user.projectIds,
      },
    };
  }
}
