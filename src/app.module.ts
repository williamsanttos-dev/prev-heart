import { InternalServerErrorException, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PushTokenModule } from './push-token/push-token.module';
import { envSchema } from './config/env.config';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    PushTokenModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          console.error('Invalid environment variables:', parsed.error.issues);
          throw new InternalServerErrorException(
            'Invalid environment variables',
          );
        }
        return parsed.data;
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
