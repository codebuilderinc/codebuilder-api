import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthInput } from './dto/google-auth.input';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ApiPaginationQuery } from '../decorators/api-nested-query.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Fetch new jobs from Reddit and Web3Career, store them, and send notifications
   */
  @Post('google')
  @ApiOperation({
    summary: 'Fetch new jobs from Reddit and Web3Career',
    description: 'Fetches new jobs from both sources, stores them, and sends notifications.',
  })
  @ApiParam({ name: 'idToken', description: 'Google ID Token', type: String })
  @ApiResponse({ status: 200, description: 'Jobs fetched and notifications sent.' })
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() googleAuthInput: GoogleAuthInput) {
    return this.authService.googleAuth(googleAuthInput.idToken);
  }
}
