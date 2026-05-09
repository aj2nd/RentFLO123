import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL = "https://api.leegality.com";
const AUTH_TOKEN = process.env.LEEGALITY_AUTH_TOKEN || "";
const PRIVATE_SALT = process.env.LEEGALITY_PRIVATE_SALT || "";
const WORKFLOW_ID = process.env.LEEGALITY_WORKFLOW_ID || "";

export function leegalityConfigured(): boolean {
  return !!(AUTH_TOKEN && PRIVATE_SALT && WORKFLOW_ID);
}

export interface LeegalityInvitee {
  name: string;
  email: string;
  phone?: string;
  signType?: string;
  sequenceOrder?: number;
  redirectUrl?: string;
  webhook?: string;
}

export interface LeegalitySendResult {
  documentId: string;
  inviteeLinks?: Array<{ inviteeId: string; signingUrl: string; email: string }>;
}

/**
 * Upload a base64 PDF to Leegality and send it for e-sign.
 * Returns the documentId so we can track the signing later.
 */
export async function sendDocumentForESign(
  pdfBase64: string,
  docName: string,
  invitees: LeegalityInvitee[]
): Promise<LeegalitySendResult> {
  const body = {
    workflowId: WORKFLOW_ID,
    file: {
      name: docName,
      file: pdfBase64,
      fields: null,
      additionalFiles: null,
    },
    invitees,
    stampSeries: "",
    seriesGroup: "",
    stampValue: "",
  };

  const res = await fetch(`${BASE_URL}/v3.0/sign`, {
    method: "POST",
    headers: {
      "X-Auth-Token": AUTH_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!res.ok) {
    throw new Error(data?.message || `Leegality API error ${res.status}`);
  }

  // Leegality returns { data: { documentId, invitees: [...] } } or similar
  const inner = data?.data || data;
  const documentId: string = inner?.documentId || inner?.document_id || inner?.id;
  if (!documentId) {
    throw new Error(`Leegality did not return a documentId. Response: ${JSON.stringify(data)}`);
  }

  const links = (inner?.invitees || []).map((inv: any) => ({
    inviteeId: inv.inviteeId || inv.id,
    signingUrl: inv.signingUrl || inv.signing_url || inv.url || "",
    email: inv.email || "",
  }));

  return { documentId, inviteeLinks: links };
}

/**
 * Verify a Leegality webhook payload using HMAC-SHA256 with the private salt.
 * The `mac` field is excluded from the payload before hashing.
 */
export function verifyLeegalityWebhook(body: Record<string, any>): boolean {
  if (!PRIVATE_SALT) return true; // No salt configured — skip verification
  const { mac, ...payload } = body;
  if (!mac) return false;
  const computed = createHmac("sha256", PRIVATE_SALT)
    .update(JSON.stringify(payload))
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(mac, "hex"));
  } catch {
    return false;
  }
}

/**
 * Fetch the signed document download URL from Leegality after completion.
 */
export async function getSignedDocumentUrl(documentId: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/v3.0/document/${documentId}`, {
      headers: { "X-Auth-Token": AUTH_TOKEN },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const inner = data?.data || data;
    return inner?.signedDocumentUrl || inner?.signed_document_url || inner?.downloadUrl || null;
  } catch {
    return null;
  }
}
