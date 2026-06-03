import { z } from "zod";

export const MAX_USER_PAGE_SIZE = 50;
export const DEFAULT_USER_PAGE_SIZE = 10;

export const userListArgsSchema = z.object({
  role: z.enum(["PARENT", "ADMIN", "COACH"]).default("PARENT"),
  searchQuery: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(MAX_USER_PAGE_SIZE).optional(),
});

export type UserListArgs = z.infer<typeof userListArgsSchema>;
