import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreditCard } from "../../schemas/credit-card.schema";
import { CreditCardPayment } from "../../schemas/credit-card-payment.schema";
import { Transaction } from "../../schemas/transaction.schema";
import { CreditCardStatementStatus, PaymentMethod } from "@moneyflow/shared";
import { CreateCreditCardDto } from "./dto/create-credit-card.dto";
import { UpdateCreditCardDto } from "./dto/update-credit-card.dto";
import { CreateCreditCardPaymentDto } from "./dto/create-credit-card-payment.dto";

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectModel(CreditCard.name) private creditCardModel: Model<CreditCard>,
    @InjectModel(CreditCardPayment.name)
    private creditCardPaymentModel: Model<CreditCardPayment>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {}

  async findAll(userId: string) {
    return this.creditCardModel
      .find({ userId: this.userFilter(userId), isActive: true })
      .sort({ name: 1 });
  }

  async create(userId: string, dto: CreateCreditCardDto) {
    return this.creditCardModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
  }

  async update(userId: string, id: string, dto: UpdateCreditCardDto) {
    const card = await this.creditCardModel.findOneAndUpdate(
      { _id: this.asObjectId(id), userId: this.userFilter(userId) },
      { $set: dto },
      { new: true },
    );
    if (!card) throw new NotFoundException("Credit card not found");
    return card;
  }

  async getOwnedCard(userId: string, id: string) {
    const card = await this.creditCardModel.findOne({
      _id: this.asObjectId(id),
      userId: this.userFilter(userId),
      isActive: true,
    });
    if (!card) throw new NotFoundException("Credit card not found");
    return card;
  }

  resolveStatementPeriod(card: CreditCard, date: Date) {
    const transactionDay = date.getUTCDate();
    let statementMonth = date.getUTCMonth() + 1;
    let statementYear = date.getUTCFullYear();

    // A purchase made after the closing day belongs to the following statement.
    if (transactionDay > card.statementClosingDay) {
      statementMonth += 1;
      if (statementMonth === 13) {
        statementMonth = 1;
        statementYear += 1;
      }
    }

    return { statementMonth, statementYear };
  }

  async getStatement(
    userId: string,
    cardId: string,
    month: number,
    year: number,
  ) {
    const card = await this.getOwnedCard(userId, cardId);
    return this.buildStatement(userId, card, month, year);
  }

  async recordPayment(
    userId: string,
    cardId: string,
    dto: CreateCreditCardPaymentDto,
  ) {
    const card = await this.getOwnedCard(userId, cardId);
    const statement = await this.buildStatement(
      userId,
      card,
      dto.statementMonth,
      dto.statementYear,
    );

    if (dto.amount > statement.outstandingAmount) {
      throw new BadRequestException(
        "Payment amount exceeds the outstanding statement balance",
      );
    }

    return this.creditCardPaymentModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
      creditCardId: card._id,
      paidAt: new Date(dto.paidAt),
    });
  }

  private async buildStatement(
    userId: string,
    card: CreditCard,
    month: number,
    year: number,
  ) {
    const cardFilter = this.cardFilter(card._id.toString());
    const match = {
      userId: this.userFilter(userId),
      creditCardId: cardFilter,
      statementMonth: Number(month),
      statementYear: Number(year),
      paymentMethod: PaymentMethod.CREDIT_CARD,
    };

    const [
      transactionTotals,
      paymentTotals,
      cardTransactionTotals,
      cardPaymentTotals,
      transactions,
    ] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: match },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      this.creditCardPaymentModel.aggregate([
        {
          $match: {
            userId: this.userFilter(userId),
            creditCardId: cardFilter,
            statementMonth: Number(month),
            statementYear: Number(year),
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            userId: this.userFilter(userId),
            creditCardId: cardFilter,
            paymentMethod: PaymentMethod.CREDIT_CARD,
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      this.creditCardPaymentModel.aggregate([
        {
          $match: {
            userId: this.userFilter(userId),
            creditCardId: cardFilter,
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      this.transactionModel
        .find(match)
        .populate("categoryId")
        .sort({ date: -1, createdAt: -1 })
        .exec(),
    ]);

    const totalAmount = transactionTotals[0]?.amount || 0;
    const paidAmount = paymentTotals[0]?.amount || 0;
    const outstandingAmount = Math.max(0, totalAmount - paidAmount);
    const totalCardOutstanding = Math.max(
      0,
      (cardTransactionTotals[0]?.amount || 0) -
        (cardPaymentTotals[0]?.amount || 0),
    );
    const dueDate = this.getDueDate(year, month, card.paymentDueDay);
    const now = new Date();
    const status =
      outstandingAmount === 0
        ? CreditCardStatementStatus.PAID
        : now > dueDate
          ? CreditCardStatementStatus.DUE
          : CreditCardStatementStatus.OPEN;

    return {
      creditCard: card,
      statementMonth: Number(month),
      statementYear: Number(year),
      dueDate,
      totalAmount,
      paidAmount,
      outstandingAmount,
      availableCredit: Math.max(0, card.creditLimit - totalCardOutstanding),
      status,
      transactions,
    };
  }

  private getDueDate(
    statementYear: number,
    statementMonth: number,
    dueDay: number,
  ) {
    const dueMonth = statementMonth === 12 ? 0 : statementMonth;
    const dueYear = statementMonth === 12 ? statementYear + 1 : statementYear;
    const finalDay = Math.min(
      dueDay,
      new Date(Date.UTC(dueYear, dueMonth + 1, 0)).getUTCDate(),
    );
    return new Date(Date.UTC(dueYear, dueMonth, finalDay, 23, 59, 59, 999));
  }

  private asObjectId(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException("Credit card not found");
    return new Types.ObjectId(id);
  }

  private userFilter(userId: string) {
    return { $in: [userId, new Types.ObjectId(userId)] };
  }

  private cardFilter(cardId: string) {
    return { $in: [cardId, new Types.ObjectId(cardId)] };
  }
}
