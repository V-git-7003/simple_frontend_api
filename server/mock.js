import cors from "cors";
import express from "express";

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.post("/api/action", (req, res) => {
  res.json({
    ok: true,
    message: "Action received",
    at: new Date().toISOString(),
    received: req.body,
  });
});

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
});
