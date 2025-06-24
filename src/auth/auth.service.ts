import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterInput, LoginInput } from './dto/auth.input';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerInput: RegisterInput) {
    const { email, password, nickname } = registerInput;

    // 이메일 중복 확인
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 고유 userId 생성
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;

    // 사용자 생성
    const user = new this.userModel({
      userId,
      email,
      password: hashedPassword,
      nickname,
    });

    await user.save();

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({ userId: user.userId });

    return {
      accessToken,
      user: {
        id: (user._id as unknown as { toString: () => string }).toString(),
        userId: user.userId,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }

  async login(loginInput: LoginInput) {
    const { email, password } = loginInput;

    // 사용자 찾기
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('잘못된 이메일 또는 비밀번호입니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('잘못된 이메일 또는 비밀번호입니다.');
    }

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({ userId: user.userId });

    return {
      accessToken,
      user: {
        id: (user._id as unknown as { toString: () => string }).toString(),
        userId: user.userId,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }
}
