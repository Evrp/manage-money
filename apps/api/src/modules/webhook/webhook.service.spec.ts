import { WebhookService } from "./webhook.service";

describe("WebhookService idempotency", () => {
  it("processes a LINE event only once when the same webhookEventId is redelivered", async () => {
    const savedEventIds = new Set<string>();
    const eventModel = {
      create: jest.fn(async ({ eventId }: { eventId: string }) => {
        if (savedEventIds.has(eventId)) {
          throw { code: 11000 };
        }
        savedEventIds.add(eventId);
        return { eventId };
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const service = new WebhookService(
      {} as any,
      eventModel as any,
      {} as any,
      {} as any,
    );
    const processEvent = jest
      .spyOn(service as any, "processEvent")
      .mockResolvedValue(undefined);
    const event = {
      webhookEventId: "line-event-1",
      type: "message",
      source: { userId: "line-user-1" },
    };

    await service.handleEvent(event);
    await service.handleEvent(event);

    expect(processEvent).toHaveBeenCalledTimes(1);
    expect(eventModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(eventModel.updateOne).toHaveBeenCalledWith(
      { eventId: "line-event-1", claimToken: expect.any(String) },
      expect.objectContaining({
        $set: { status: "completed" },
      }),
    );
  });
});
