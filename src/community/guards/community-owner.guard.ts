import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from '../community.service';

@Injectable()
export default class CommunityOwnerGuard implements CanActivate {
  constructor(private readonly communityService: CommunityService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log('request can activate', request);
    const communityId = request.params?.id ?? '-1';
    if (communityId === '-1') {
      return true;
    }
    const { user } = request as ReqWithUser;
    return this.communityService.isOwnerOfCommunity(user, +communityId);
  }
}
