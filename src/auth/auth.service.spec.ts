import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    // Mock UserModel
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      constructor: jest.fn(),
    };

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

  // 추가 테스트 케이스들...
  describe('register', () => {
    it('should register a new user', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.prototype.save = jest.fn().mockResolvedValue({
        _id: 'mock-id',
        userId: 'user_123',
        email: 'test@example.com',
        nickname: 'testuser',
      });

      const result = await service.register(registerInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});