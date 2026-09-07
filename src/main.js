const button = document.getElementById("trigger");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
  button.disabled = true;
  result.textContent = "Sending POST /api/action…";

  try {
    const res = await fetch("http://localhost:3001/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo" }),
    });
    const data = await res.json();
    result.textContent = `HTTP ${res.status}\n${JSON.stringify(data, null, 2)}`;
  } catch (err) {
    result.textContent = `Request failed: ${err.message}\nIs the mock server running on port 3001?`;
  } finally {
    button.disabled = false;
  }
});
