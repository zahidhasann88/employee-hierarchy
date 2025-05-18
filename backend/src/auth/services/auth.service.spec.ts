import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { LoggerService } from '../../logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../enums/role.enum';

class UserEntityMock implements User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    return password === 'correctPassword';
  }

  async hashPassword(): Promise<void> {
    // Mock implementation
  }
}

type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let repository: MockRepository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(() => Promise.resolve('signed-jwt-token')),
            verify: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.secret': 'test-secret',
                'jwt.expiresIn': '1h',
                'jwt.refreshExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<MockRepository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const user = new UserEntityMock();
      user.id = 1;
      user.username = 'testuser';
      user.password = 'hashedPassword';
      
      (repository.findOne as jest.Mock).mockResolvedValue(user);
      
      const result = await service.validateUser('testuser', 'correctPassword');
      expect(result).toEqual({
        data: user,
        success: true,
        message: 'User validated successfully'
      });
    });

    it('should return error if credentials are invalid', async () => {
      const user = new UserEntityMock();
      user.id = 1;
      user.username = 'testuser';
      user.password = 'hashedPassword';
      
      (repository.findOne as jest.Mock).mockResolvedValue(user);
      
      const result = await service.validateUser('testuser', 'wrongPassword');
      expect(result).toEqual({
        success: false,
        message: 'Unauthorized access'
      });
    });
  });

  describe('login', () => {
    it('should return token if credentials are valid', async () => {
      const user = new UserEntityMock();
      user.id = 1;
      user.username = 'testuser';
      user.password = 'hashedPassword';
      user.role = UserRole.USER;
      
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        data: user,
        success: true,
        message: 'User validated successfully'
      });
      
      const result = await service.login({ username: 'testuser', password: 'correctPassword' });
      
      expect(result.data).toBeDefined();
      expect(result.data!.accessToken).toBe('signed-jwt-token');
      expect(result.data!.username).toBe('testuser');
      expect(result.data!.role).toBe(UserRole.USER);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User logged in successfully');
    });

    it('should return error if credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        success: false,
        message: 'Unauthorized access'
      });
      
      const result = await service.login({ username: 'testuser', password: 'wrongPassword' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized access');
    });
  });
});