import { BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { CreditCardsService } from "./credit-cards.service";
import { CreditCard } from "../../schemas/credit-card.schema";

describe("CreditCardsService", () => {
  const card = {
    _id: new Types.ObjectId(),
    statementClosingDay: 25,
    paymentDueDay: 10,
    creditLimit: 50_000,
  } as CreditCard;
  const paymentModel = { create: jest.fn() };
  const service = new CreditCardsService(
    {} as any,
    paymentModel as any,
    {} as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it("assigns purchases on or before closing day to the current statement", () => {
    expect(
      service.resolveStatementPeriod(
        card,
        new Date("2026-08-25T12:00:00.000Z"),
      ),
    ).toEqual({ statementMonth: 8, statementYear: 2026 });
  });

  it("assigns purchases after closing day to the next statement across years", () => {
    expect(
      service.resolveStatementPeriod(
        card,
        new Date("2026-12-26T12:00:00.000Z"),
      ),
    ).toEqual({ statementMonth: 1, statementYear: 2027 });
  });

  it("rejects a payment greater than the statement balance", async () => {
    jest.spyOn(service, "getOwnedCard").mockResolvedValue(card as any);
    jest
      .spyOn(service as any, "buildStatement")
      .mockResolvedValue({ outstandingAmount: 100 });

    await expect(
      service.recordPayment("507f1f77bcf86cd799439011", card._id.toString(), {
        statementMonth: 8,
        statementYear: 2026,
        amount: 100.01,
        paidAt: "2026-09-01",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(paymentModel.create).not.toHaveBeenCalled();
  });

  it("records an in-range payment without creating an expense transaction", async () => {
    jest.spyOn(service, "getOwnedCard").mockResolvedValue(card as any);
    jest
      .spyOn(service as any, "buildStatement")
      .mockResolvedValue({ outstandingAmount: 100 });
    paymentModel.create.mockResolvedValue({ _id: "payment-1" });

    await service.recordPayment(
      "507f1f77bcf86cd799439011",
      card._id.toString(),
      {
        statementMonth: 8,
        statementYear: 2026,
        amount: 100,
        paidAt: "2026-09-01",
      },
    );

    expect(paymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        creditCardId: card._id,
        paidAt: expect.any(Date),
      }),
    );
  });
});
