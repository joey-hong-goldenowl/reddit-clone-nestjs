import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AssetModule } from './asset/asset.module';
import { CommunityModule } from './community/community.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { OnesignalModule } from './onesignal/onesignal.module';
import { GoogleModule } from './google/google.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        PORT: Joi.number(),
        JWT_SECRET_KEY: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        ONESIGNAL_APP_ID: Joi.string().required(),
        ONESIGNAL_API_KEY: Joi.string().required(),
        ONESIGNAL_USER_AUTH_KEY: Joi.string().required(),
        ENVIRONMENT: Joi.string().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required()
      })
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    ProfileModule,
    CloudinaryModule,
    AssetModule,
    CommunityModule,
    PostModule,
    CommentModule,
    OnesignalModule,
    GoogleModule
  ]
})
export class AppModule {}
