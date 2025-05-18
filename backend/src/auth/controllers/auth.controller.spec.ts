import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenDto } from '../dto/token.dto';
import { CommonResponse } from '../../common/dto/common-response.dto';
import { CustomThrottlerGuard } from '../../common/guards/throttle.guard';
import { UserRole } from '../enums/role.enum';
import { ThrottlerStorage } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: 'THROTTLER:MODULE_OPTIONS',
          useValue: {
            ttl: 60,
            limit: 10,
          },
        },
        {
          provide: ThrottlerStorage,
          useValue: {
            increment: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: CustomThrottlerGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const expectedResponse: CommonResponse<TokenDto> = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          username: 'testuser',
          role: UserRole.USER,
        },
        success: true,
        message: 'User logged in successfully',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return error on failed login', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const expectedResponse: CommonResponse<TokenDto> = {
        success: false,
        message: 'Unauthorized access',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should return tokens on successful registration', async () => {
      const registerDto: RegisterDto = {
        username: 'newuser',
        password: 'password123',
        role: UserRole.USER,
      };

      const expectedResponse: CommonResponse<TokenDto> = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          username: 'newuser',
          role: UserRole.USER,
        },
        success: true,
        message: 'User registered successfully',
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return error if username already exists', async () => {
      const registerDto: RegisterDto = {
        username: 'existinguser',
        password: 'password123',
        role: UserRole.USER,
      };

      const expectedResponse: CommonResponse<TokenDto> = {
        success: false,
        message: 'Username already exist',
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);
      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockRequest = {
        user: {
          userId: 1,
          username: 'testuser',
          role: UserRole.USER,
        },
      };

      const expectedResponse: CommonResponse<null> = {
        message: 'Logged out successfully',
        success: true,
      };

      jest.spyOn(authService, 'logout').mockResolvedValue(expectedResponse);

      const result = await controller.logout(mockRequest);
      expect(result).toEqual(expectedResponse);
      expect(authService.logout).toHaveBeenCalledWith(mockRequest.user.userId);
    });
  });
}); 