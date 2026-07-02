import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SubscriptionState } from "@/types/billing";

/**
 * Authentification de démonstration : comptes en mémoire, sans base de
 * données. Les comptes seedés sont recréés à chaque démarrage du serveur ;
 * les comptes inscrits via /register vivent le temps du processus.
 */

export interface StudioUser {
  email: string;
  name: string;
  company?: string;
  passwordHash: string;
  subscription: SubscriptionState;
}

export interface PublicUser {
  email: string;
  name: string;
  subscription: SubscriptionState;
}

export const ADMIN_EMAIL = "salim.elrs@gmail.com";
export const DEMO_EMAIL = "demo@studio-one.test";

// `||` et non `??` : une variable présente mais vide (AUTH_SECRET= dans
// un .env copié depuis .env.example) doit retomber sur la valeur par défaut.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "StudioOne2026!";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "DemoStudio2026!";

const PASSWORD_SALT = "studio-one-demo-salt";
const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${PASSWORD_SALT}:${password}`)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function seedUsers(): Promise<Map<string, StudioUser>> {
  const users = new Map<string, StudioUser>();

  users.set(ADMIN_EMAIL, {
    email: ADMIN_EMAIL,
    name: "Salim",
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    subscription: {
      planId: "unlimited",
      planName: "Illimité",
      status: "active",
      renewsAt: "2027-07-01T00:00:00.000Z",
      creditsTotal: 0,
      creditsUsed: 0,
      unlimited: true,
    },
  });

  users.set(DEMO_EMAIL, {
    email: DEMO_EMAIL,
    name: "Claire Fontanel",
    company: "Nova CRM",
    passwordHash: await hashPassword(DEMO_PASSWORD),
    subscription: {
      planId: "growth",
      planName: "Growth",
      status: "active",
      renewsAt: "2026-07-18T00:00:00.000Z",
      creditsTotal: 5,
      creditsUsed: 3,
    },
  });

  return users;
}

const globalStore = globalThis as unknown as {
  __studioUsers?: Promise<Map<string, StudioUser>>;
};

function getUsers(): Promise<Map<string, StudioUser>> {
  if (!globalStore.__studioUsers) {
    globalStore.__studioUsers = seedUsers();
  }
  return globalStore.__studioUsers;
}

export function toPublicUser(user: StudioUser): PublicUser {
  return { email: user.email, name: user.name, subscription: user.subscription };
}

export async function authenticate(
  email: string,
  password: string
): Promise<StudioUser | null> {
  const users = await getUsers();
  const user = users.get(email.trim().toLowerCase());
  if (!user) return null;
  const hash = await hashPassword(password);
  return hash === user.passwordHash ? user : null;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  company?: string;
}): Promise<StudioUser | "exists"> {
  const users = await getUsers();
  const email = input.email.trim().toLowerCase();
  if (users.has(email)) return "exists";

  const user: StudioUser = {
    email,
    name: input.name.trim(),
    company: input.company?.trim() || undefined,
    passwordHash: await hashPassword(input.password),
    subscription: {
      planId: "starter",
      planName: "Starter",
      status: "active",
      renewsAt: "2026-08-01T00:00:00.000Z",
      creditsTotal: 2,
      creditsUsed: 0,
    },
  };
  users.set(email, user);
  return user;
}

export async function getSessionUser(): Promise<StudioUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const email = await verifySessionToken(token);
  if (!email) return null;
  const users = await getUsers();
  return users.get(email) ?? null;
}

/** À utiliser dans les pages serveur du dashboard : session obligatoire. */
export async function requireUser(): Promise<StudioUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
