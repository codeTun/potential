export async function GET() {
  return new Response(JSON.stringify({ message: "Hello from the API!" }), {
    status: 200,
  });
}
