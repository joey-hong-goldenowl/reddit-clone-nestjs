import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from '@onesignal/node-onesignal';
import { UserService } from 'src/user/user.service';
import { OneSignalExtraData } from './interface/onesignal.interface';

@Injectable()
export class OneSignalService {
  constructor(private readonly configService: ConfigService, private readonly userService: UserService) {}

  initOneSignal() {
    const oneSignalUserAuthKey = this.configService.get<string>('ONESIGNAL_USER_AUTH_KEY');
    const oneSignalApiKey = this.configService.get<string>('ONESIGNAL_API_KEY');
    return new OneSignal.DefaultApi(
      OneSignal.createConfiguration({
        authMethods: {
          user_key: {
            tokenProvider: {
              getToken() {
                return oneSignalUserAuthKey;
              }
            }
          },
          app_key: {
            tokenProvider: {
              getToken() {
                return oneSignalApiKey;
              }
            }
          }
        }
      })
    );
  }

  async createNotification(userId: number, message: string, extraData: OneSignalExtraData) {
    const playerId = await this.userService.getUserOneSignalPlayerId(userId);
    if (playerId === null) {
      return;
    }
    const client = this.initOneSignal();
    const notification = new OneSignal.Notification();
    notification.app_id = this.configService.get<string>('ONESIGNAL_APP_ID');

    notification.contents = {
      en: message
    };

    notification.headings = {
      en: 'Reddit clone'
    };

    notification.include_player_ids = [playerId];

    if (Object.keys(extraData).length > 0) {
      notification.data = {
        ...extraData
      };
    }
    await client.createNotification(notification);
  }
}
