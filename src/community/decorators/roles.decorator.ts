import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '../entities/community_member.entity';

export default (...roles: MemberRole[]) => SetMetadata('roles', roles);
