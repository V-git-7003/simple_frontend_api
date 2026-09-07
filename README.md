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

## Try next

- Change the JSON in `main.js` and confirm `received` on the page.
- Return a 400 from Express and handle `!res.ok` in the frontend.
- Point `fetch` at a real API URL and keep the same request/response pattern.
