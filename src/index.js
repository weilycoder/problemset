async function verifyPassword(env, verification) {
  const passkey = env.PASS_KEY;
  const encoder = new TextEncoder();
  const data = encoder.encode(verification ?? "");
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === passkey;
}

async function listProblems(env) {
  let problems = [];
  let cursor = undefined;
  do {
    const listResult = await env.PROBLEMSET.list({ cursor: cursor });
    listResult.keys.forEach((key) => { problems.push(key.name); });
    cursor = listResult.cursor;
  } while (cursor);
  return problems;
}

async function handleListProblems(request, env) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const problems = await listProblems(env);
  return new Response(JSON.stringify(problems), {
    headers: { "Content-Type": "application/json" },
  });
}

async function getProblem(request, env, id) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const problem = await env.PROBLEMSET.get(id);
  if (problem) {
    return new Response(problem, {
      headers: { "Content-Type": "text/plain" },
    });
  } else {
    return new Response("Problem not found", { status: 404 });
  }
}

async function submitProblem(request, env, id) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("Received problem submission:", body);

  const problemData = body?.problem;
  if (!problemData) {
    return new Response("Missing problem data", { status: 400 });
  }

  const verification = body?.verification ?? "";
  if (!verification) {
    return new Response("Missing verification", { status: 400 });
  }

  const isVerified = await verifyPassword(env, verification);
  if (!isVerified) {
    return new Response("Unauthorized", { status: 401 });
  }

  await env.PROBLEMSET.put(id, problemData);
  return new Response("Problem submitted", { status: 201 });
}

async function deleteProblem(request, env, id) {
  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const verification = body?.verification ?? "";
  if (!verification) {
    return new Response("Missing verification", { status: 400 });
  }

  const isVerified = await verifyPassword(env, verification);
  if (!isVerified) {
    return new Response("Unauthorized", { status: 401 });
  }

  const problem = await env.PROBLEMSET.get(id);
  if (!problem) {
    return new Response("Problem not found", { status: 404 });
  }

  const success = await env.PROBLEMSET.delete(id);
  if (!success) {
    return new Response("Failed to delete problem", { status: 500 });
  }

  return new Response("Problem deleted", { status: 200 });
}

async function handleProblem(request, env, id) {
  if (request.method === "GET") {
    return await getProblem(request, env, id);
  } else if (request.method === "POST") {
    return await submitProblem(request, env, id);
  } else if (request.method === "DELETE") {
    return await deleteProblem(request, env, id);
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }
}

async function handleProblemPage(request, env, id) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const problem = await env.PROBLEMSET.get(id);
  if (!problem) {
    return new Response("Problem not found", { status: 404 });
  }

  const html = `<meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg" /><style>body{background:radial-gradient(1200px 800px at 10% -10%, #ffe7c7 0%, transparent 60%),radial-gradient(900px 600px at 90% 10%, #d9efe6 0%, transparent 55%),#f4f0e8;}</style>${problem}<style class="fallback">body {visibility: hidden;white-space: pre;font-family: "JetBrains Mono", "monospace";}</style><script src="/markdeep.min.js" charset="utf-8"></script><script>window.alreadyProcessedMarkdeep || (document.body.style.visibility = "visible")</script>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/api/problems") {
      return await handleListProblems(request, env);
    } else if (path.startsWith("/api/problem/")) {
      const id = path.slice("/api/problem/".length);
      return await handleProblem(request, env, id);
    } else if (path.startsWith("/problem/")) {
      const id = path.slice("/problem/".length);
      return await handleProblemPage(request, env, id);
    }
    return new Response("Not Found", { status: 404 });
  }
};
