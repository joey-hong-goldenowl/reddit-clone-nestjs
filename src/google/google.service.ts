import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Auth, google } from 'googleapis';

@Injectable()
export class GoogleService {
  oauthClient: Auth.OAuth2Client;
  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    this.oauthClient = new google.auth.OAuth2({
      clientId,
      clientSecret
    });
  }

  async getTokenInfo(token: string) {
    const tokenInfo = await this.oauthClient.getTokenInfo(token);
    return tokenInfo;
  }

  async getUserData(token: string) {
    const userInfoClient = google.oauth2('v2').userinfo;

    this.oauthClient.setCredentials({
      access_token: token
    });

    const userInfoResponse = await userInfoClient.get({
      auth: this.oauthClient
    });

    return userInfoResponse.data;
  }
}
