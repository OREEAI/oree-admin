export type Tier =
  | "starter"
  | "professional"
  | "business"
  | "enterprise"
  | "custom";

// Mirrors core/enums/model_enums.py → UserRoleChoices. The admin console
// gates on the "super_admin" value of the user's `role` field.
export type Role = "super_admin" | "org_admin" | "member" | "content_admin";
