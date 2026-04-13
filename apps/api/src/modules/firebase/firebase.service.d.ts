import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class FirebaseService implements OnModuleInit {
    private configService;
    private storage;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    getBucket(): import("@google-cloud/storage").Bucket;
    getSignedUrl(filePath: string, expires?: number): Promise<string>;
    /**
     * Deletes a file from storage given its URL
     * @param url The public or signed URL of the file
     */
    deleteFileFromUrl(url: string): Promise<void>;
}
