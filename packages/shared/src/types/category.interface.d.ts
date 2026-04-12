export declare enum CategoryType {
    INCOME = "income",
    EXPENSE = "expense",
    SAVING = "saving"
}
export interface ICategory {
    _id?: any;
    userId: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
    monthlyLimit?: number;
    isDefault: boolean;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
