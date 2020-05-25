import express from "express";
import fs from "fs/promises";
import log from "loglevel";
import path from "path";

log.setDefaultLevel("debug");

const dataDir = "./data";
const dataFile = "state.json";
const specPattern = "wordbook/";

var app = express();
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.send("pong");
});

app.get("/api/state", (req, res) => {
  res.sendFile(dataFile, { root: dataDir });
});

app.post("/api/state", async (req, res) => {
  if (req.body) {
    const state = req.body;
    const spec = state.spec;
    if (spec && spec.startsWith(specPattern)) {
      await fs.writeFile(
        path.join(dataDir, dataFile),
        JSON.stringify(req.body, undefined, 2)
      );
    }
    res.json({ status: "ok" });
  } else {
    res.json({ status: "error" });
  }
});

app.listen(3010);
