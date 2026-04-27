import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { auth } from './modules/auth/auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/*', toNodeHandler(auth));
  expressApp.use(json());
  expressApp.use(urlencoded({ extended: true }));

  app.setGlobalPrefix('api/v1/guide-exam');

  const originsFromEnv = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigins = originsFromEnv.length
    ? originsFromEnv
    : ['https://hope.lourd.top:2605', 'capacitor://localhost', 'ionic://localhost', 'http://localhost'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api/v1/guide-exam`);
}

bootstrap();
