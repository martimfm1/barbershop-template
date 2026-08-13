import process from "node:process";

const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const routes = [
  "/",
  "/login",
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/clientes",
  "/dashboard/servicos",
  "/dashboard/equipa",
  "/dashboard/mensagens",
  "/dashboard/settings",
  "/dashboard/billing",
];

const expectedPrivateRedirects = new Set([
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/clientes",
  "/dashboard/servicos",
  "/dashboard/equipa",
  "/dashboard/mensagens",
  "/dashboard/settings",
  "/dashboard/billing",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkRoute(route) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    headers: { "User-Agent": "Silentra-QA-Smoke/1.0" },
  });

  const location = response.headers.get("location");
  const allowedRedirect = expectedPrivateRedirects.has(route) && location;

  assert(
    response.status < 500,
    `${route}: respondeu ${response.status}`,
  );

  assert(
    response.status === 200 || allowedRedirect || (response.status >= 300 && response.status < 400),
    `${route}: estado inesperado ${response.status}${location ? ` -> ${location}` : ""}`,
  );

  return {
    route,
    status: response.status,
    location,
  };
}

async function main() {
  console.log(`Smoke QA: ${baseUrl}`);

  const results = [];
  for (const route of routes) {
    try {
      results.push(await checkRoute(route));
      const result = results.at(-1);
      console.log(`✓ ${result.route} (${result.status})${result.location ? ` -> ${result.location}` : ""}`);
    } catch (error) {
      console.error(`✕ ${route}: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  }

  if (process.exitCode === 1) {
    throw new Error("Smoke QA falhou.");
  }

  console.log(`\n${results.length}/${routes.length} rotas verificadas.`);
}

await main();
