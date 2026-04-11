export interface IBudget {
  _id?: any;
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
  spentAmount: number;
  alertSent80: boolean;
  alertSent90: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
