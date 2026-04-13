import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const serviceAccount = this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT");
    const bucketName = this.configService.get<string>("FIREBASE_STORAGE_BUCKET");

    if (!admin.apps.length) {
      if (serviceAccount) {
        const config = JSON.parse(serviceAccount);
        admin.initializeApp({
          credential: admin.credential.cert(config),
          storageBucket: bucketName,
        });
      } else {
        // Fallback for local development if file exists
        const serviceAccountPath = path.resolve(
          process.cwd(),
          "src/modules/firebase/manager-money-f9507-firebase-adminsdk-fbsvc-4eaf51239a.json",
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          storageBucket: bucketName,
        });
      }
    }

    this.storage = admin.storage();
  }

  getBucket() {
    return this.storage.bucket();
  }

  async getSignedUrl(filePath: string, expires: number = 3600): Promise<string> {
    const bucket = this.getBucket();
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expires * 1000,
    });

    return url;
  }
}
