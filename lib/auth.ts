import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

const memoryDb = {
  user: [],
  session: [],
  account: [],
  verification: [],
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: memoryAdapter(memoryDb),
  emailAndPassword: {
    enabled: true,
  },
});
