import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from '../community.service';

@Injectable()
export default class NotCommunityOwnerGuard implements CanActivate {
  constructor(private readonly communityService: CommunityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const communityId = request.params?.id ?? '-1';
    if (communityId === '-1') {
      return true;
    }
    const { user } = request as ReqWithUser;
    const isOwner = await this.communityService.isOwnerOfCommunity(user, +communityId);
    if (isOwner) {
      throw new BadRequestException();
    }
    return true;
  }
}
