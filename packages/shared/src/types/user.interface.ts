export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  GREEN = 'green',
  OCEAN = 'ocean',
}

export interface IUser {
  _id?: any;
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  email?: string;
  theme: Theme;
  currency: string;
  monthlyBudget?: number;
  financialScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}
