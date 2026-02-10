import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation for DTOs (class-validator)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Optional: enable CORS for frontend requests
  app.enableCors();

  // Default port
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

bootstrap();
