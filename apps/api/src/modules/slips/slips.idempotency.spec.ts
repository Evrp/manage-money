import { BadRequestException } from "@nestjs/common";
import { SlipsService } from "./slips.service";

describe("SlipsService atomic save claim", () => {
  it("does not create a transaction when another request owns the slip claim", async () => {
    const slipUploadModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    };
    const transactionsService = {
      findBySourceSlipId: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const service = new SlipsService(
      slipUploadModel as any,
      transactionsService as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.confirmFromLine(
        "507f1f77bcf86cd799439011",
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013",
        "expense",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(slipUploadModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: { $exists: false },
        $or: expect.arrayContaining([
          { saveClaimExpiresAt: { $exists: false } },
        ]),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          saveClaimToken: expect.any(String),
          saveClaimExpiresAt: expect.any(Date),
        }),
      }),
      { new: true },
    );
    expect(transactionsService.create).not.toHaveBeenCalled();
  });
});
