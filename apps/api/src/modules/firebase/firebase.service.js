"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
let FirebaseService = class FirebaseService {
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const serviceAccount = this.configService.get("FIREBASE_SERVICE_ACCOUNT");
        const bucketName = this.configService.get("FIREBASE_STORAGE_BUCKET");
        if (!admin.apps.length) {
            if (serviceAccount) {
                const config = JSON.parse(serviceAccount);
                admin.initializeApp({
                    credential: admin.credential.cert(config),
                    storageBucket: bucketName,
                });
            }
            else {
                // Fallback for local development if file exists
                const serviceAccountPath = path.resolve(process.cwd(), "src/modules/firebase/manager-money-f9507-firebase-adminsdk-fbsvc-4eaf51239a.json");
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
    async getSignedUrl(filePath, expires = 3600) {
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
    async deleteFileFromUrl(url) {
        if (!url)
            return;
        try {
            const bucket = this.getBucket();
            let filePath = null;
            // Logic to extract path from Firebase/GCS URLs
            if (url.includes("storage.googleapis.com")) {
                // Handle format: https://storage.googleapis.com/bucket/path/to/file or signed variants
                const bucketName = bucket.name;
                const parts = url.split(`${bucketName}/`);
                if (parts.length > 1) {
                    filePath = decodeURIComponent(parts[1].split("?")[0]);
                }
            }
            else if (url.includes("firebasestorage.googleapis.com")) {
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
        }
        catch (error) {
            // We don't want to fail the whole delete operation if storage delete fails,
            // but we should log it.
            console.error("Failed to delete file from Firebase Storage:", error);
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map