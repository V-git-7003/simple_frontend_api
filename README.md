# Frontend–backend communication (minimal demo)

A smallest-possible app for seeing how a browser talks to a backend: one button, one HTTP request, one JSON response.

The frontend does not execute backend code. It sends a request. The backend receives that request, does work, and returns a response. This repo makes that round-trip visible.

## What you will see

Two processes run at the same time:

| Process | What it is | URL |
|---|---|---|
| Vite | Serves the HTML/JS/CSS page | http://localhost:5173 |
| Express | Mock API (stand-in for a real backend) | http://localhost:3001 |

Click **Trigger action**. The page sends `POST /api/action` with a JSON body. The mock server replies with JSON. The page prints the HTTP status and body.

```
Browser (5173)  --POST /api/action-->  Mock API (3001)
                <-- JSON { ok, message, at, received } --
```

## Run it

Needs Node.js.

```bash
npm install
npm start
```

Open http://localhost:5173 and click the button.

- `npm run dev` — frontend only
- `npm run mock` — API only
- `npm start` — both

If the mock is not running, `fetch` fails and the page shows an error. That is expected: there is nothing listening on port 3001.

## Vite and Express

These are two separate Node programs. They do not share memory or call each other’s functions. They only meet over HTTP.

**Vite** is a frontend dev server (and, in other projects, a production bundler). `npm run dev` starts it. It serves `index.html` at http://localhost:5173, serves `src/main.js` and `src/style.css` as native ES modules, and reloads the page when those files change. Vite is not the backend: it does not run `app.post(...)`. It only delivers HTML/JS/CSS so the browser can run `fetch`. This demo uses the **dev** server only; a production app would typically `vite build` to static files and host those somewhere else.

**Express** is a small HTTP server library. `npm run mock` runs `server/mock.js`, which listens on http://localhost:3001. A few Express pieces in that file:

- `app.use(...)` is **middleware**: it runs on matching requests before your route. `cors` and `express.json()` are middleware.
- `app.post("/api/action", handler)` is a **route**: only `POST` to that path hits this function.
- `req` is the incoming request (`req.body` is the JSON the browser sent).
- `res.json(...)` writes status 200, `Content-Type: application/json`, and the body.

| | Vite | Express |
|---|---|---|
| Job | Serve the UI | Handle API requests |
| Port | 5173 | 3001 |
| Audience | Browser loading the app | Browser `fetch` (or `curl`) |
| Typical code | HTML, JS, CSS | Routes, DB, auth, business logic |

`npm start` uses `concurrently` so both stay running. Vite never sees the POST. Express never serves your CSS.

### A click, end to end

1. You open http://localhost:5173 → Vite sends HTML/JS.
2. You click the button → `main.js` runs `fetch("http://localhost:3001/api/action", ...)`.
3. The browser may first send `OPTIONS` (CORS preflight). Express/`cors` answers that.
4. The browser sends `POST` with `{ "action": "demo" }`.
5. Express runs the route and `res.json(...)`.
6. `main.js` reads `res.status` and the JSON and prints it.

## How to inspect the conversation

1. Open DevTools → **Network**.
2. Click the button.
3. Look for `OPTIONS /api/action` (CORS preflight) then `POST /api/action`.
4. Open the POST: **Headers** (URL, method, `Content-Type`), **Payload** (`{ "action": "demo" }`), **Response** (JSON from Express).

That panel is the real frontend–backend interface: HTTP, not a special JavaScript-to-server channel.

## Code map

| File | Role |
|---|---|
| [`index.html`](index.html) | Button (`#trigger`) and result box (`#result`) |
| [`src/main.js`](src/main.js) | Click handler: `fetch` → parse JSON → show it |
| [`src/style.css`](src/style.css) | Layout only; not part of the protocol |
| [`server/mock.js`](server/mock.js) | Express: CORS, JSON body parsing, `POST /api/action` |
| [`vite.config.js`](vite.config.js) | Frontend on port 5173 |
| [`package.json`](package.json) | Scripts to run Vite and the mock together |

The important lines are in `src/main.js`:

```js
const res = await fetch("http://localhost:3001/api/action", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "demo" }),
});
const data = await res.json();
```

And in `server/mock.js`:

```js
app.post("/api/action", (req, res) => {
  res.json({
    ok: true,
    message: "Action received",
    at: new Date().toISOString(),
    received: req.body,
  });
});
```

`received` echoes the body the browser sent so you can confirm both directions.

## Ideas that matter

**HTTP is the contract.** Method, URL, headers, and body go out. Status and body come back. Swap Express for FastAPI, Rails, or a cloud API and the browser still uses `fetch` the same way. Only the URL and JSON shape change.

**Two origins.** The page is `http://localhost:5173`; the API is `http://localhost:3001`. Different ports mean different origins. The browser will not let page JavaScript read the response unless the API sends CORS headers. `cors({ origin: "http://localhost:5173" })` does that. CORS is a browser rule; `curl` and other servers are not bound by it.

**`fetch` is asynchronous.** `await` waits for the network without freezing the UI. A thrown error usually means the request never completed (server down, CORS blocked, network failure). An HTTP 4xx/5xx still resolves; you would check `res.ok` or `res.status`.

**The button is not the backend.** It only schedules a request. Work happens in `app.post(...)`.

**Vite can proxy the API (optional).** Instead of calling `http://localhost:3001` from the browser (and dealing with CORS), many apps add a proxy in `vite.config.js` so `/api` is forwarded to Express:

```js
server: {
  port: 5173,
  proxy: {
    "/api": "http://localhost:3001",
  },
}
```

Then the frontend would `fetch("/api/action")`. The browser thinks it is talking to 5173; Vite forwards to Express. Same two processes, one origin from the browser’s point of view. This demo skips that on purpose so you can see CORS and two URLs in Network.

## Try next

- Change the JSON in `main.js` and confirm `received` on the page.
- Return a 400 from Express and handle `!res.ok` in the frontend.
- Point `fetch` at a real API URL and keep the same request/response pattern.
- Add the Vite proxy above, switch `fetch` to `/api/action`, and compare Network (no cross-origin `OPTIONS` to 3001).
