import { getDatabaseHealthSummary } from "@/data/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = getDatabaseHealthSummary();

  return Response.json(
    {
      status: "ok",
      service: "web-next",
      databaseConfigured: database.databaseConfigured,
    },
    { status: 200 },
  );
}
