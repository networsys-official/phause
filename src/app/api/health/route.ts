export async function GET() {
  return Response.json({
    status: "ok",
    service: "phause",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
}
