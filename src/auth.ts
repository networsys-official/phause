import NextAuth, { CredentialsSignin, type Session } from "next-auth";
import type { NextRequest } from "next/server";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/infrastructure/database/prisma";
import { passwordMeetsRequirements } from "@/lib/security";
import { logger } from "@/shared/lib/logger";

const LOCAL_DEVELOPMENT_SECRET = "local-test-secret";

function resolveAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  return process.env.NODE_ENV === "production" ? undefined : LOCAL_DEVELOPMENT_SECRET;
}

export function assertRuntimeAuthSecret(): void {
  const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isProductionBuild && !process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for authentication.");
  }
}

export const runtime = "nodejs";

const DUMMY_HASH = "$2b$12$odqCBNjCW5OHzRxj6YoNaOupn.HNeHGfSqAB.DdXuAjC9q/8VZEsq";

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        console.log("AUTHORIZE_START", {
          suppliedEmail: credentials?.email ?? null,
          normalizedEmail: email,
          hasPassword: Boolean(credentials?.password),
          passwordLength: password.length,
        });

        try {
          if (!email || !password) {
            console.error("AUTHORIZE_INVALID_INPUT", {
              suppliedEmail: credentials?.email ?? null,
              normalizedEmail: email,
              hasPassword: Boolean(credentials?.password),
            });
            throw new CredentialsSignin("Invalid email or password.");
          }

          const { default: bcrypt } = await import("bcrypt");

          const user = await prisma.user.findUnique({ where: { email } });
          console.log("USER_FOUND", {
            suppliedEmail: email,
            userFound: Boolean(user),
            userId: user?.id ?? null,
            role: user?.role ?? null,
            status: user?.status ?? null,
          });
          logger.info("USER_FOUND", {
            found: Boolean(user),
            email,
            userId: user?.id ?? null,
            role: user?.role ?? null,
            status: user?.status ?? null,
          });

          if (!user) {
            const dummyMatch = await bcrypt.compare(password, DUMMY_HASH);
            console.log("AUTHORIZE_RETURN_NULL_INVALID_USER", {
              email,
              dummyMatch,
            });
            return null;
          }

          if (user.status === "DISABLED") {
            console.log("AUTHORIZE_THROW_ACCOUNT_DISABLED", { email, userId: user.id, status: user.status });
            throw new Error("account_disabled");
          }

          const lockExpiry = user.lockedUntil ? new Date(user.lockedUntil) : null;
          if (lockExpiry && lockExpiry > new Date()) {
            console.log("AUTHORIZE_THROW_ACCOUNT_LOCKED", { email, userId: user.id, lockExpiry: lockExpiry.toISOString() });
            throw new Error("account_locked");
          }

          if (!user.passwordHash) {
            logger.warn("PASSWORD_HASH_FOUND", { found: false, email, userId: user.id });
            console.log("AUTHORIZE_THROW_MISSING_PASSWORD_HASH", { email, userId: user.id });
            throw new CredentialsSignin("Invalid email or password.");
          }

          logger.info("PASSWORD_HASH_FOUND", {
            found: true,
            email,
            userId: user.id,
            length: user.passwordHash.length,
          });

          const passwordMatch = await bcrypt.compare(password, user.passwordHash);
          console.log("PASSWORD_MATCH", {
            suppliedEmail: email,
            userFound: Boolean(user),
            passwordMatched: passwordMatch,
            role: user.role,
            status: user.status,
          });
          logger.info("PASSWORD_MATCH", {
            email,
            userId: user.id,
            passwordMatch,
            status: user.status,
            role: user.role,
          });

          if (!passwordMatch) {
            const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
            const shouldLock = nextAttempts >= 5;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: nextAttempts,
                lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
                status: shouldLock ? "LOCKED" : user.status,
              },
            });

            console.log("AUTHORIZE_RETURN_NULL_BAD_PASSWORD", {
              email,
              userId: user.id,
              failedLoginAttempts: nextAttempts,
              shouldLock,
            });
            return null;
          }

          if (user.status !== "ACTIVE") {
            logger.warn("USER_STATUS_BLOCKED", {
              email,
              userId: user.id,
              status: user.status,
            });
            throw new Error("account_disabled");
          }

          const roleAllowed = user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "EDITOR" || user.role === "AUTHOR" || user.role === "VIEWER";
          if (!roleAllowed) {
            logger.warn("USER_ROLE_BLOCKED", {
              email,
              userId: user.id,
              role: user.role,
            });
            throw new Error("Unauthorized role");
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              status: "ACTIVE",
              lastLoginAt: new Date(),
            },
          });

          logger.info("LOGIN_SUCCESS", {
            email,
            userId: user.id,
            role: user.role,
            status: user.status,
          });

          const normalizedUser = {
            id: String(user.id),
            email: user.email,
            role: user.role,
            status: user.status,
          };

          console.log("AUTHORIZE_RETURN", {
            suppliedEmail: email,
            userFound: Boolean(user),
            passwordMatched: true,
            role: normalizedUser.role,
            status: normalizedUser.status,
          });

          return normalizedUser;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const normalizedError = message.toLowerCase().replace(/[^a-z0-9]+/g, "");

          console.error("AUTHORIZE_CATCH", {
            error: message,
            normalizedError,
            name: error instanceof Error ? error.name : "UnknownError",
            email,
            stack: error instanceof Error ? error.stack : undefined,
          });
          logger.error("Credential authentication failed", {
            email,
            error: message,
          });

          if (error instanceof CredentialsSignin) {
            console.log("AUTHORIZE_RETHROW_CREDENTIALS_SIGNIN", { message, email });
            throw error;
          }

          if (["invalidcredentials", "accountlocked", "accountdisabled"].includes(normalizedError)) {
            console.log("AUTHORIZE_RETHROW_CUSTOM_AUTH_ERROR", { message, email, normalizedError });
            throw new Error(message);
          }

          console.log("AUTHORIZE_RETHROW_SERVICE_UNAVAILABLE", { message, email, normalizedError });
          throw new Error("service_unavailable");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("AUTH_CALLBACK", {
        type: "jwt",
        hasUser: Boolean(user),
        userId: user?.id ?? null,
        tokenSub: token.sub ?? null,
      });
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role?: string }).role ?? "VIEWER";
        token.status = (user as typeof user & { status?: string }).status ?? "ACTIVE";
      }
      return token;
    },
    async session({ session, token }) {
      console.log("AUTH_CALLBACK", {
        type: "session",
        hasSessionUser: Boolean(session.user),
        userEmail: session.user?.email ?? null,
        tokenSub: token.sub ?? null,
      });
      if (session.user) {
        session.user.id = String(token.sub ?? token.id ?? "");
        session.user.role = (token.role as string | undefined) ?? "VIEWER";
        session.user.status = (token.status as string | undefined) ?? "ACTIVE";
        logger.info("SESSION_CREATED", {
          userId: session.user.id,
          email: session.user.email ?? null,
          role: session.user.role,
          status: session.user.status,
        });
      }
      return session;
    },
    async authorized({ auth, request }) {
      console.log("AUTH_CALLBACK", {
        type: "authorized",
        pathname: request.nextUrl.pathname,
        hasAuthUser: Boolean(auth?.user),
        authUserEmail: auth?.user?.email ?? null,
      });
      const pathname = request.nextUrl.pathname;
      const isProtectedCmsRoute = pathname.startsWith("/studio") || pathname.startsWith("/cms") || pathname.startsWith("/api/cms");

      if (!isProtectedCmsRoute) {
        return true;
      }

      if (!auth?.user) {
        return false;
      }

      const role = auth.user.role ?? "VIEWER";
      const isRestrictedAdminAction = pathname.startsWith("/studio/users") || pathname.startsWith("/studio/audit") || pathname.startsWith("/cms/users") || pathname.startsWith("/cms/audit") || pathname.startsWith("/api/cms/users") || pathname.startsWith("/api/cms/audit");

      if (isRestrictedAdminAction) {
        return role === "SUPER_ADMIN" || role === "ADMIN";
      }

      return true;
    },
  },
});

export function auth(): Promise<Session | null>;
export function auth(request: NextRequest): Promise<Session | Response | null>;
export function auth(request?: NextRequest): Promise<Session | Response | null> {
  assertRuntimeAuthSecret();
  return nextAuth.auth();
}

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export async function createPasswordHash(password: string) {
  if (!passwordMeetsRequirements(password)) {
    throw new Error("Password must be at least 12 characters with uppercase, lowercase, number, and symbol.");
  }

  const { default: bcrypt } = await import("bcrypt");
  return bcrypt.hash(password, 12);
}
