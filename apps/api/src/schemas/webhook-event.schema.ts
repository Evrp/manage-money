import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum WebhookEventStatus {
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Schema({ timestamps: true, collection: "webhook_events" })
export class WebhookEvent extends Document {
  @Prop({ required: true })
  eventId: string;

  @Prop({ type: String, enum: WebhookEventStatus, required: true })
  status: WebhookEventStatus;

  @Prop({ required: true })
  claimToken: string;

  @Prop({ required: true })
  leaseExpiresAt: Date;

  @Prop({ required: true })
  expireAt: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
WebhookEventSchema.index({ eventId: 1 }, { unique: true });
WebhookEventSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
