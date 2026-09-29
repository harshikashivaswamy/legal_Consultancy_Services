import { createFileRoute } from "@tanstack/react-router";
import { getAdminClient, isSupabaseConfiguredServer } from "@/lib/otp.server";

/**
 * Lightweight health endpoint for load balancers / ECS.
 *  GET /api/health         -> always 200 while the server process is up (liveness)
 *  GET /api/health?deep=1  -> also pings the database (503 if unreachable)
 * It never returns secrets or configuration values, only booleans.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const deep = new URL(request.url).searchParams.get("deep") === "1";
        const body: Record<string, unknown> = {
          status: "ok",
          time: new Date().toISOString(),
          databaseConfigured: isSupabaseConfiguredServer(),
        };
        let status = 200;

        if (deep) {
          const admin = getAdminClient();
          if (!admin) {
            body["database"] = "service-role-key-missing";
          } else {
            const { error } = await admin.from("lawyers").select("id", { head: true, count: "exact" }).limit(1);
            if (error) {
              body["database"] = "unreachable";
              body["status"] = "degraded";
              status = 503;
            } else {
              body["database"] = "ok";
            }
          }
        }

        return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
