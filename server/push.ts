import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions, notifications } from "@shared/schema";
import { eq } from "drizzle-orm";

let vapidInitialized = false;

export async function initVapid() {
  if (vapidInitialized) return;

  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    process.env.VAPID_PUBLIC_KEY = publicKey;
    process.env.VAPID_PRIVATE_KEY = privateKey;
    console.log("[push] Generated new VAPID keys (ephemeral — set as secrets for persistence)");
    console.log("[push] VAPID_PUBLIC_KEY:", publicKey);
  }

  webpush.setVapidDetails(
    "mailto:help@rentflo.com",
    publicKey,
    privateKey
  );

  vapidInitialized = true;
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string = "/"
) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          throw err;
        }
      }
    })
  );

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length) {
    console.error(`[push] ${failed.length} push(es) failed for user ${userId}`);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: "RENT_ADVANCED" | "RENT_COLLECTED" | "MAINTENANCE_CREATED" | "MAINTENANCE_RESOLVED" | "RENT_DUE",
  url: string = "/"
) {
  await db.insert(notifications).values({ userId, title, body, type, url });
  await sendPushToUser(userId, title, body, url).catch(err =>
    console.error("[push] sendPushToUser error:", err)
  );
}
