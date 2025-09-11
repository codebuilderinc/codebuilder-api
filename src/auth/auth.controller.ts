import { Body, Controller, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthInput } from './dto/google-auth.input';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Fetch new jobs from Reddit and Web3Career, store them, and send notifications
   */
  @Post('google')
  @Api({
    summary: 'Google authentication',
    description: 'Authenticate a user using a Google ID token and optional buildType.',
    bodyType: GoogleAuthInput,
  envelope: true,
    responses: [
      { status: 200, description: 'Authenticated successfully.' },
      { status: 400, description: 'ID token missing or invalid.' },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() googleAuthInput: GoogleAuthInput) {
    const { idToken, buildType } = googleAuthInput;

    if (!idToken) {
      throw new BadRequestException('ID token is required');
    }

    return this.authService.googleAuth(idToken, buildType);
  }
}
