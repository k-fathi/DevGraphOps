/** Public repository analysis stays server-side so all supported providers use one reliable same-origin path. */
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { analyzePublicRepository } from "../client/src/lib/repositoryParser";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const repositoryCache = new Map<string, { expiresAt: number; result: Awaited<ReturnType<typeof analyzePublicRepository>> }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function analyzeCachedRepository(url: string) {
  const key = url.trim().toLowerCase().replace(/\/$/, "");
  const cached = repositoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const result = await analyzePublicRepository(url);
  repositoryCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  repository: router({
    analyze: publicProcedure
      .input(z.object({ url: z.string().trim().min(1).max(2048) }))
      .mutation(({ input }) => analyzeCachedRepository(input.url)),
  }),
});

export type AppRouter = typeof appRouter;
