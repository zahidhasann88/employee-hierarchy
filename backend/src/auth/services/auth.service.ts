import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { TokenDto } from '../dto/token.dto';
import { LoggerService } from '../../logger/logger.service';
import { RegisterDto } from '../dto/register.dto';
import { CommonResponse } from '../../common/dto/common-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtPayload } from '../interfaces/jwt.interface';
import { UserRole } from '../enums/role.enum';
import {
  UNAUTHORIZED,
  INTERNAL_SERVER_ERROR,
} from '../../common/common.message';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<CommonResponse<User>> {
    try {
      const user = await this.userRepository.findOne({ where: { username } });

      if (user && (await user.validatePassword(password))) {
        return {
          data: user,
          message: 'User validated successfully',
          success: true,
        };
      }

      return {
        message: UNAUTHORIZED,
        success: false,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error validating user',
        username,
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async validateUserById(userId: number): Promise<CommonResponse<User>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          message: 'User not found',
          success: false,
        };
      }

      return {
        data: user,
        message: 'User validated successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error validating user by ID',
        userId,
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async login(loginDto: LoginDto): Promise<CommonResponse<TokenDto>> {
    try {
      const { username, password } = loginDto;
      const userResponse = await this.validateUser(username, password);

      if (!userResponse.success || !userResponse.data) {
        this.logger.warn({
          message: 'Login failed: Invalid credentials',
          username,
        });
        return {
          message: UNAUTHORIZED,
          success: false,
        };
      }

      const user = userResponse.data;
      return this.generateTokens(user);
    } catch (error) {
      this.logger.error({
        message: 'Error during login',
        username: loginDto.username,
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async register(registerDto: RegisterDto): Promise<CommonResponse<TokenDto>> {
    try {
      const { username, password, role } = registerDto;

      const existingUser = await this.userRepository.findOne({
        where: { username },
      });

      if (existingUser) {
        this.logger.warn({
          message: 'Registration failed: Username already exists',
          username,
        });
        return {
          message: 'Username already exist',
          success: false,
        };
      }

      const user = this.userRepository.create({
        username,
        password,
        role,
      });

      await this.userRepository.save(user);

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error({
        message: 'Error during registration',
        username: registerDto.username,
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<CommonResponse<TokenDto>> {
    try {
      const { refreshToken } = refreshTokenDto;

      let payload: JwtPayload;
      try {
        payload = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('jwt.secret'),
        });
      } catch (error) {
        this.logger.warn({
          message: 'Invalid refresh token',
          error: error.message,
        });
        return {
          message: 'Invalid refresh token',
          success: false,
        };
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        return {
          message: 'Invalid refresh token',
          success: false,
        };
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        return {
          message: 'Invalid refresh token',
          success: false,
        };
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error({
        message: 'Error refreshing token',
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }

  private async generateTokens(user: User): Promise<CommonResponse<TokenDto>> {
    try {
      const payload: JwtPayload = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      });

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      user.refreshToken = hashedRefreshToken;
      await this.userRepository.save(user);

      this.logger.log({
        message: 'User logged in successfully',
        userId: user.id,
        username: user.username,
      });

      return {
        data: new TokenDto(accessToken, refreshToken, user.username, user.role as UserRole),
        message: 'User logged in successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error generating tokens',
        userId: user.id,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR);
    }
  }

  async logout(userId: number): Promise<CommonResponse<null>> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return {
          message: 'User not found',
          success: false,
        };
      }

      user.refreshToken = '';
      await this.userRepository.save(user);

      return {
        message: 'Logged out successfully',
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Error during logout',
        userId,
        error: error.message,
        stack: error.stack,
      });
      return {
        message: INTERNAL_SERVER_ERROR,
        success: false,
      };
    }
  }
}
