
import {Role} from '@prisma/client'


export class User {
  id: number ;
createdAt: Date ;
updatedAt: Date ;
email: string ;
password: string ;
firstname: string  | null;
lastname: string  | null;
username: string  | null;
profilePicture: string  | null;
googleId: string  | null;
role: Role ;
wallet: string  | null;
is_active: boolean  | null;
}
