import crypto from "crypto";

import { getServerCredentials } from "@/config/credentials";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type SumsubError = {
  code?: number;
  description?: string;
  errorCode?: number;
  errorName?: string;
  correlationId?: string;
};

export class SumsubApiError extends Error {
  name = "SumsubApiError";
  status: number;
  body: unknown;

  constructor(message: string, params: { status: number; body: unknown }) {
    super(message);
    this.status = params.status;
    this.body = params.body;
  }
}

function buildSignature(params: {
  secretKey: string;
  ts: number;
  method: HttpMethod;
  pathWithQuery: string;
  body: string;
}): string {
  const toSign = `${params.ts}${params.method}${params.pathWithQuery}${params.body}`;
  return crypto
    .createHmac("sha256", params.secretKey)
    .update(toSign)
    .digest("hex");
}

async function sumsubRequest<T>(params: {
  method: HttpMethod;
  pathWithQuery: string;
  body?: unknown;
}): Promise<T> {
  const creds = getServerCredentials();
  const appToken = creds.sumsub.appToken;
  const secretKey = creds.sumsub.secretKey;
  if (!appToken || !secretKey) throw new Error("Sumsub no configurado");

  const bodyString =
    params.body === undefined ? "" : JSON.stringify(params.body);
  const url = `${creds.sumsub.baseUrl}${params.pathWithQuery}`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature({
      secretKey,
      ts,
      method: params.method,
      pathWithQuery: params.pathWithQuery,
      body: bodyString,
    });

    let res: Response;
    try {
      res = await fetch(url, {
        method: params.method,
        headers: {
          "Content-Type": "application/json",
          "X-App-Token": appToken,
          "X-App-Access-Sig": sig,
          "X-App-Access-Ts": ts.toString(),
        },
        body: bodyString ? bodyString : undefined,
        cache: "no-store",
      });
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 150 * attempt));
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const parsed = contentType.includes("application/json")
      ? ((await res.json().catch(() => null)) as unknown)
      : ((await res.text().catch(() => "")) as unknown);

    if (res.ok) return parsed as T;

    if (res.status >= 500 && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 150 * attempt));
      continue;
    }

    const err = (parsed ?? {}) as SumsubError;
    const message = err.description ?? `Sumsub error ${res.status}`;
    throw new SumsubApiError(message, { status: res.status, body: parsed });
  }

  throw new Error("Sumsub request falló");
}

export type SumsubApplicant = {
  id: string;
  externalUserId?: string;
  type?: "individual" | "company";
};

export type SumsubApplicantDetails = {
  id: string;
  externalUserId?: string;
  type?: "individual" | "company";
  info?: Record<string, unknown>;
  fixedInfo?: Record<string, unknown>;
};

export async function createApplicant(params: {
  externalUserId: string;
  levelName: string;
  type: "individual" | "company";
  fixedInfo?: Record<string, unknown>;
}): Promise<SumsubApplicant> {
  const qs = new URLSearchParams({ levelName: params.levelName }).toString();
  return sumsubRequest<SumsubApplicant>({
    method: "POST",
    pathWithQuery: `/resources/applicants?${qs}`,
    body: {
      externalUserId: params.externalUserId,
      type: params.type,
      fixedInfo: params.fixedInfo ?? undefined,
    },
  });
}

export async function getApplicantByExternalUserId(
  externalUserId: string,
): Promise<SumsubApplicant> {
  return sumsubRequest<SumsubApplicant>({
    method: "GET",
    pathWithQuery: `/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}/one`,
  });
}

export async function getApplicantDetails(applicantId: string): Promise<SumsubApplicantDetails> {
  return sumsubRequest<SumsubApplicantDetails>({
    method: "GET",
    pathWithQuery: `/resources/applicants/${encodeURIComponent(applicantId)}/one`,
  });
}

export type SumsubWebSdkLink = { url: string };

export async function createWebSdkLink(params: {
  userId: string;
  levelName: string;
  ttlInSecs: number;
}): Promise<SumsubWebSdkLink> {
  return sumsubRequest<SumsubWebSdkLink>({
    method: "POST",
    pathWithQuery: "/resources/sdkIntegrations/levels/-/websdkLink",
    body: {
      levelName: params.levelName,
      userId: params.userId,
      ttlInSecs: params.ttlInSecs,
    },
  });
}

export type SumsubAccessToken = { token: string; userId: string };

export async function createSdkAccessToken(params: {
  userId: string;
  levelName: string;
  ttlInSecs: number;
}): Promise<SumsubAccessToken> {
  return sumsubRequest<SumsubAccessToken>({
    method: "POST",
    pathWithQuery: "/resources/accessTokens/sdk",
    body: {
      userId: params.userId,
      levelName: params.levelName,
      ttlInSecs: params.ttlInSecs,
    },
  });
}
