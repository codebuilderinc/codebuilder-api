import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('users')
export class UserController {
  constructor(private userService: UserService) {}
}
