import { User } from 'src/user/entities/user.entity';

export interface ReqWithUser extends Request {
  user: User;
}

export interface TokenPayload {
  userId: number;
}
