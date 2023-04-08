import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MemberRole } from '../entities/community_member.entity';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from '../community.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export default class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly communityService: CommunityService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<MemberRole[]>('roles', context.getHandler());
    if (!roles) return true;
    const request = context.switchToHttp().getRequest();
    const communityId = Number(request.params?.id ?? '-1');
    if (communityId === -1) return true;
    const { user } = request as ReqWithUser;
    return this.matchRoles(user, communityId, roles);
  }

  async matchRoles(user: User, communityId: number, roles: MemberRole[]): Promise<boolean> {
    return await this.communityService.isAuthorized(user, communityId, roles);
  }
}
