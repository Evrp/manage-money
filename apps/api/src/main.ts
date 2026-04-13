import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";

const server = express();

export const createApp = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.enableCors();
  await app.init();
  return app;
};

// For local development
if (process.env.NODE_ENV !== "production") {
  const bootstrap = async () => {
    const app = await createApp(server);
    await app.listen(process.env.PORT || 3000);
    console.log(`Application is running on: http://localhost:${process.env.PORT || 3000}`);
  };
  bootstrap();
}

// Export for Vercel
export default server;
