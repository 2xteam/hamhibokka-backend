import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let mockAuthService: any;

  beforeEach(async () => {
    // Mock AuthService
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const registerInput = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      const expectedResult = {
        accessToken: 'mock-token',
        user: {
          id: 'mock-id',
          userId: 'user_123',
          email: 'test@example.com',
          nickname: 'testuser',
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await resolver.register(registerInput);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerInput);
      expect(result).toEqual(expectedResult);
    });
  });
});