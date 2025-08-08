export const UserType = {
    Admin: "Admin",
    Staff: "Staff",
    Vendor: "Vendor"
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];
export const ItemStatus = {
    Available: "Available",
    Pending: "Pending",
    Sold: "Sold",
    Removed: "Removed"
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];
