import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../schemas/user.schema';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    // Mock UserModel - 생성자 함수처럼 동작하도록 설정
    const mockUserInstance = {
      save: jest.fn().mockResolvedValue({
        _id: { toString: () => 'mock-id' },
        userId: 'user_123',
        email: 'test@example.com',
        nickname: 'testuser',
        password: 'hashedPassword',
      }),
    };

    mockUserModel = jest.fn().mockImplementation(() => mockUserInstance);
    mockUserModel.findOne = jest.fn();
    mockUserModel.create = jest.fn();

    // Mock JwtService
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      // 이메일 중복 체크 - 중복 없음
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.register(registerInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should throw error if email already exists', async () => {
      const registerInput = {
        email: 'existing@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      // 이메일 중복 체크 - 중복 있음
      mockUserModel.findOne.mockResolvedValue({
        email: 'existing@example.com',
      });

      await expect(service.register(registerInput)).rejects.toThrow(
        '이미 존재하는 이메일입니다.',
      );
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: { toString: () => 'mock-id' },
        userId: 'user_123',
        email: 'test@example.com',
        nickname: 'testuser',
        password: '$2a$10$hashedPassword', // bcrypt 해시된 비밀번호
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      // bcrypt.compare를 mock
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.login(loginInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });
});
