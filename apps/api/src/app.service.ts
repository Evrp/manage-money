import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth(): string {
    return "Fumi Manager API is running";
  }
}
