export interface IBankAccount {
  _id?: any;
  userId: string;
  name: string;
  bankName: string;
  last4?: string;
  color?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
