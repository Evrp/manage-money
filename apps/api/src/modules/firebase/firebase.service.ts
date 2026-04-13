import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const serviceAccount = this.configService.get<string>(
      "FIREBASE_SERVICE_ACCOUNT",
    );
    const bucketName = this.configService.get<string>(
      "FIREBASE_STORAGE_BUCKET",
    );

    if (!admin.apps.length) {
      if (serviceAccount) {
        try {
          const config = JSON.parse(serviceAccount);
          admin.initializeApp({
            credential: admin.credential.cert(config),
            storageBucket: bucketName,
          });
          console.log("Firebase Admin initialized from ENV.");
        } catch (error) {
          console.error("Failed to initialize Firebase from ENV:", error);
        }
      } else if (process.env.NODE_ENV === "development") {
        // ONLY fallback in development
        try {
          const serviceAccountPath = path.resolve(
            process.cwd(),
            "src/modules/firebase/manager-money-f9507-firebase-adminsdk-fbsvc-4eaf51239a.json",
          );
          
          if (fs.existsSync(serviceAccountPath)) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccountPath),
              storageBucket: bucketName,
            });
            console.log("Firebase Admin initialized from local file.");
          } else {
            console.warn("Firebase local credentials file not found.");
          }
        } catch (error) {
          console.warn("Firebase fallback initialization failed:", error.message);
        }
      } else {
        console.warn("Firebase credentials not provided. Firebase features disabled.");
      }
    }

    if (admin.apps.length) {
      this.storage = admin.storage();
    }
  }

  getBucket() {
    if (!this.storage) {
      throw new Error("Firebase storage is not initialized properly. Check environment variables.");
    }
    return this.storage.bucket();
  }

  async getSignedUrl(
    filePath: string,
    expires: number = 3600,
  ): Promise<string> {
    const bucket = this.getBucket();
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expires * 1000,
    });

    return url;
  }

  /**
   * Deletes a file from storage given its URL
   * @param url The public or signed URL of the file
   */
  async deleteFileFromUrl(url: string): Promise<void> {
    if (!url) return;

    try {
      const bucket = this.getBucket();
      let filePath: string | null = null;

      // Logic to extract path from Firebase/GCS URLs
      if (url.includes("storage.googleapis.com")) {
        // Handle format: https://storage.googleapis.com/bucket/path/to/file or signed variants
        const bucketName = bucket.name;
        const parts = url.split(`${bucketName}/`);
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1].split("?")[0]);
        }
      } else if (url.includes("firebasestorage.googleapis.com")) {
        // Handle format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media...
        const parts = url.split("/o/");
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1].split("?")[0]);
        }
      }

      if (filePath) {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Successfully deleted file from storage: ${filePath}`);
        }
      }
    } catch (error) {
      // We don't want to fail the whole delete operation if storage delete fails,
      // but we should log it.
      console.error("Failed to delete file from Firebase Storage:", error);
    }
  }
}
