import express from "express";
import fs from "fs/promises";
import fsLegacy from "fs";
import log from "loglevel";
import path from "path";
import process from "process";
import _ from "lodash";

log.setDefaultLevel("info");

const dataDir = "./data";
const buildDir = "./build";

const specPattern = "wordbook/";

var app = express();
app.use(express.json());

const booksConfig = [
  {
    name: "ziyang",
    file: "ziyang.json",
  },
  {
    name: "yijun",
    file: "yijun.json",
  },
];

const getDataFile = (file) => {
  const f = path.join(dataDir, file);
  return f;
};

const makeResult = (payload, result = true) => {
  if (result) {
    return {
      status: "ok",
      error: undefined,
      data: payload,
    };
  } else {
    return {
      status: "error",
      error: payload,
      data: undefined,
    };
  }
};

app.get("/api/books", async (req, res) => {
  const result = [];
  for (const bookConfig of booksConfig) {
    const dataFile = getDataFile(bookConfig.file);
    log.info("read data file", dataFile);
    const content = await fs.readFile(dataFile);
    const doc = JSON.parse(content);
    result.push({
      name: bookConfig.name,
      wordCount: doc._words.length,
      version: doc.version,
    });
  }
  res.json(makeResult(_.sortBy(result, (item) => -item.version)));
});

const findBookConfig = (bookName) =>
  _.find(booksConfig, (bookConfig) => bookConfig.name === bookName);

// get state
app.get("/api/books/:bookName/raw", (req, res) => {
  const matched = findBookConfig(req.params.bookName);
  if (matched) {
    res.sendFile(matched.file, { root: dataDir });
  } else {
    res.sendStatus(404);
  }
});

// save state
app.post("/api/books/:bookName", async (req, res) => {
  const matched = findBookConfig(req.params.bookName);
  if (matched && req.body) {
    const state = req.body;
    const spec = state.spec;
    if (spec && spec.startsWith(specPattern)) {
      await fs.writeFile(
        getDataFile(matched.file),
        JSON.stringify(req.body, undefined, 2)
      );
      log.info(`${matched.file} saved.`);
    }
    res.json(makeResult());
  } else {
    res.json(makeResult(null, false));
  }
});

// testing api
app.get("/api/ping", (req, res) => {
  res.send(makeResult("pong"));
});

app.get("/pages/*", function (req, res) {
  res.sendFile("index.html", { root: buildDir });
});

// forward to web app
app.use(express.static("./build"));

app.listen(process.env.PORT || 7000);
