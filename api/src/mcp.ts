/**
 * MCP (Model Context Protocol) request handler stub.
 * TODO: implement full MCP endpoint logic.
 *
 * Generic over the env type so callers in `index.ts` can pass their
 * concrete `Env` without TypeScript widening to `unknown` and breaking
 * the `verifyJwt` parameter contract.
 */
export async function handleMcpRequest<E>(
  _request: Request,
  _env: E,
  _verifyJwt: (token: string, env: E) => Promise<{ sub?: string } | null>,
  _checkBilling: (userId: string, convexUrl: string) => Promise<unknown>,
): Promise<Response> {
  return new Response(
    JSON.stringify({ error: "mcp_not_implemented" }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
}
