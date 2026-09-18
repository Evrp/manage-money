import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BankAccount } from "../../schemas/bank-account.schema";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectModel(BankAccount.name)
    private readonly bankAccountModel: Model<BankAccount>,
  ) {}

  findAll(userId: string) {
    return this.bankAccountModel
      .find({ userId, isActive: true })
      .sort({ name: 1 });
  }

  create(userId: string, dto: CreateBankAccountDto) {
    return this.bankAccountModel.create({ userId, ...dto });
  }

  async getOwnedAccount(userId: string, id: string) {
    const account = await this.bankAccountModel.findOne({
      _id: id,
      userId,
      isActive: true,
    });
    if (!account) throw new NotFoundException("Bank account not found");
    return account;
  }
}
