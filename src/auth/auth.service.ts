import { PrismaService } from 'nestjs-prisma';
import { Prisma, User } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService
  ) {
    // Initialize Google OAuth2 client
    this.googleClient = new OAuth2Client();
  }

  async createUser(payload: SignupInput): Promise<Token> {
    const hashedPassword = await this.passwordService.hashPassword(payload.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...payload,
          password: hashedPassword,
          role: 'USER',
        },
      });

      return this.generateTokens({
        userId: user.id,
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Email ${payload.email} already used.`);
      }

      if (e instanceof Error) {
        throw e;
      }

      let message = 'Unknown error';
      if (typeof e === 'string') {
        message = e;
      } else if (e && typeof e === 'object') {
        try {
          message = JSON.stringify(e);
        } catch {
          message = Object.prototype.toString.call(e);
        }
      } else if (e === null) {
        message = 'null';
      } else {
        switch (typeof e) {
          case 'number':
          case 'boolean':
          case 'bigint':
          case 'symbol':
          case 'undefined':
          case 'function':
            message = e.toString();
            break;
          default:
            message = 'Unknown error';
        }
      }

      throw new Error(message);
    }
  }

  async login(wallet: string, password: string): Promise<Token> {
    console.log('login');
    const user = await this.prisma.user.findUnique({ where: { wallet } });

    if (!user) {
      throw new NotFoundException(`No user found for email: ${wallet}`);
    }

    const passwordValid = await this.passwordService.validatePassword(password, 'password login disabled');

    if (!passwordValid) {
      throw new BadRequestException('Invalid password');
    }

    return this.generateTokens({
      userId: user.id,
    });
  }

  validateUser(userId: number): Promise<User> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  getUserFromToken(token: string): Promise<User> {
    const id = this.jwtService.decode(token)['userId'];
    return this.prisma.user.findUnique({ where: { id } });
  }

  generateTokens(payload: { userId: number }): Token {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private generateAccessToken(payload: { userId: number }): string {
    return this.jwtService.sign(payload as any);
  }

  /**
   * Generates a JWT refresh token for the specified user.
   *
   * @param payload - The payload containing the user identifier
   * @param payload.userId - The unique identifier of the user
   * @returns A signed JWT refresh token string
   *
   * @remarks
   * The refresh token is signed using:
   * - Secret: Environment variable `JWT_REFRESH_TOKEN_SECRET` or fallback to 'nestjsPrismaRefreshSecret'
   * - Expiration: Environment variable `JWT_REFRESH_EXPIRATION_TIME` or fallback to '60m'
   *
   * @private
   */
  private generateRefreshToken(payload: { userId: number }): string {
    return this.jwtService.sign(
      payload as any,
      {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'nestjsPrismaRefreshSecret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION_TIME || '60m') as any,
      } as any
    );
  }

  /**
   * Refreshes an access token using a valid refresh token.
   *
   * Verifies the provided refresh token and generates a new set of tokens (access and refresh)
   * for the authenticated user.
   *
   * @param token - The JWT refresh token to verify and use for generating new tokens
   * @returns A new set of authentication tokens (access token and refresh token)
   * @throws {UnauthorizedException} When the refresh token is invalid, expired, or malformed
   *
   * @example
   * ```typescript
   * const newTokens = await authService.refreshToken(oldRefreshToken);
   * // Returns: { accessToken: string, refreshToken: string }
   * ```
   */
  refreshToken(token: string) {
    try {
      const { userId } = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'nestjsPrismaRefreshSecret',
      });

      return this.generateTokens({
        userId,
      });
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  /**
   * Authenticates a user using Google OAuth ID token.
   *
   * This method verifies the Google ID token using the appropriate OAuth client ID
   * based on the build type (development or production). If the user doesn't exist,
   * it creates a new user with the Google profile information. If the user exists,
   * it updates their profile with the latest Google information.
   *
   * @param idToken - The Google OAuth ID token to verify
   * @param buildType - Optional build type ('development' or undefined for production)
   *                    that determines which Google OAuth client ID to use
   *
   * @returns A Promise that resolves to a Token object containing access and refresh tokens
   *
   * @throws {UnauthorizedException} If the OAuth client ID is missing for the specified build type
   * @throws {UnauthorizedException} If the Google ID token is invalid
   * @throws {UnauthorizedException} If the email is not provided by Google
   * @throws {UnauthorizedException} If there's an OAuth client ID mismatch
   * @throws {UnauthorizedException} If Google authentication fails for any other reason
   *
   * @remarks
   * - Uses different Google OAuth client IDs for development and production builds
   * - Creates new users with role 'USER' and no password (OAuth-only authentication)
   * - Updates existing users' profile information (username, profile picture, Google ID, names)
   * - Logs authentication progress and errors for debugging purposes
   */
  async googleAuth(idToken: string, buildType?: string): Promise<Token> {
    try {
      // Determine which client ID to use based on build type
      const clientId =
        buildType === 'development' ? process.env.GOOGLE_WEB_CLIENT_ID_DEV : process.env.GOOGLE_WEB_CLIENT_ID;

      if (!clientId) {
        console.error(`Missing Google OAuth client ID for build type: ${buildType}`);
        throw new UnauthorizedException('OAuth configuration error');
      }

      console.log(`🔍 Verifying Google token for ${buildType || 'production'} build`);
      console.log(`🔑 Using client ID: ${clientId.substring(0, 20)}...`);

      // Verify the Google ID token with the appropriate client ID
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, name, picture, given_name, family_name, sub: googleId } = payload;

      if (!email) {
        throw new UnauthorizedException('Email not provided by Google');
      }

      console.log(`✅ Google token verified successfully for ${email}`);

      // Find or create user based on email or googleId
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { googleId }],
        },
      });

      if (!user) {
        // Create new user with Google info
        user = await this.prisma.user.create({
          data: {
            email,
            username: name || '', // Google display name (full name)
            firstname: given_name || '',
            lastname: family_name || '',
            profilePicture: picture || null,
            googleId,
            role: 'USER',
            password: '', // No password for Google auth
            is_active: true,
          },
        });
        console.log(`👤 Created new user: ${email}`);
      } else {
        // Update existing user with latest Google info
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            username: name || user.username,
            profilePicture: picture || user.profilePicture,
            googleId: googleId || user.googleId,
            // Update name fields if they weren't set before
            firstname: user.firstname || given_name || '',
            lastname: user.lastname || family_name || '',
          },
        });
        console.log(`👤 Updated existing user: ${email}`);
      }

      // Generate and return tokens
      return this.generateTokens({
        userId: user.id,
      });
    } catch (error: any) {
      console.error('Google auth error:', error);

      // More specific error handling
      if (error?.message?.includes('audience')) {
        throw new UnauthorizedException('OAuth client ID mismatch - check your build configuration');
      }

      throw new UnauthorizedException('Google authentication failed');
    }
  }
}
