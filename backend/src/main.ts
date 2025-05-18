import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggerService } from './logger/logger.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.use(helmet());
  app.use(compression());
  app.use((req, res, next) => new RequestIdMiddleware().use(req, res, next));

  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
  );

  const configService = app.get(ConfigService);
  logger.log('Loading configuration...', 'Bootstrap');
  logger.debug(
    `Database config: ${JSON.stringify({
      host: configService.get('database.host'),
      port: configService.get('database.port'),
      database: configService.get('database.name'),
      poolSize: configService.get('database.poolSize'),
    })}`,
    'Bootstrap',
  );

  app.enableCors(configService.get('cors'));
  logger.log('CORS enabled', 'Bootstrap');

  const config = new DocumentBuilder()
    .setTitle('Employee Hierarchy API')
    .setDescription('API for managing employee hierarchy')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  logger.log('Swagger documentation setup complete', 'Bootstrap');

  const port = configService.get('port') || 3000;

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully', 'Bootstrap');
    await app.close();
    logger.log('Application closed successfully', 'Bootstrap');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully', 'Bootstrap');
    await app.close();
    logger.log('Application closed successfully', 'Bootstrap');
    process.exit(0);
  });

  const memoryInterval = setInterval(() => {
    const used = process.memoryUsage();
    logger.debug(
      `Memory usage - rss: ${Math.round(used.rss / 1024 / 1024)}MB, heapTotal: ${Math.round(used.heapTotal / 1024 / 1024)}MB, heapUsed: ${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      'MemoryMonitor',
    );
  }, 30000);

  await app.listen(port);
  logger.log(
    `Application successfully started and listening on port ${port}`,
    'Bootstrap',
  );

  return { app, memoryInterval };
}
bootstrap();
