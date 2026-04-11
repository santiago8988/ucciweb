const organizationId = process.env.ORGANIZATION_ID;

if (!organizationId) {
  throw new Error(
    "Missing ORGANIZATION_ID environment variable. Add it to .env.local."
  );
}

export const ORGANIZATION_ID: string = organizationId;
