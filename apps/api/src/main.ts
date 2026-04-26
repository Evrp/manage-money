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
    { bodyParser: false },
  );

  // Configure middleware to capture raw body for LINE signature verification
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        if (req.url.includes("webhook")) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  await app.init();
  return app;
};

// For local development
if (process.env.NODE_ENV !== "production") {
  const bootstrap = async () => {
    const app = await createApp(server);
    await app.listen(process.env.PORT || 3000);
    console.log(
      `Application is running on: http://localhost:${process.env.PORT || 3000}`,
    );
  };
  bootstrap();
}

// Handler for Vercel
let appPromise: any;
export default async (req: any, res: any) => {
  if (!appPromise) {
    appPromise = createApp(server);
  }
  await appPromise;
  return server(req, res);
};
