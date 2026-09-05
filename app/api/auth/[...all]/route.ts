import { getAuth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

async function handler(request: Request) {
  const auth = await getAuth();
  const nextHandler = toNextJsHandler(auth.handler);
  const method = request.method === "POST" ? nextHandler.POST : nextHandler.GET;

  return method(request);
}

export { handler as GET, handler as POST };
