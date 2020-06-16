import express from "express";
import fs from "fs/promises";
// import fsLegacy from "fs";
import path from "path";
import process from "process";

import _ from "lodash";
import log from "loglevel";

import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync.js";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 12);

log.setDefaultLevel("info");

const dataDir = "./data";
const dataFile = "db.json";
const buildDir = "../build";
const specPattern = "wordbook/";

const adapter = new FileSync(path.join(dataDir, dataFile));
const db = low(adapter);

const getBooks = () => {
  return db.get("books").value();
};

const findBook = (bookId) => db.get("books").find({ id: bookId }).value();

const app = express();
app.use(express.json());

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
  for (const book of getBooks()) {
    result.push({
      id: book.id,
      name: book.name,
      wordCount: book._words.length,
      version: book.version,
    });
  }
  res.json(makeResult(_.sortBy(result, (item) => -item.version)));
});

// get state
app.get("/api/books/:bookId", (req, res) => {
  const matched = findBook(req.params.bookId);
  if (matched) {
    res.json(makeResult(matched));
  } else {
    res.status(404).json(makeResult("no such book", false));
  }
});

const createNewId = (name) => {
  if (name && name.match(/^[a-z]+$/gi)) {
    return name;
  } else {
    return nanoid();
  }
};

// create by template
app.post("/api/books", async (req, res) => {
  const { templateId, name, wordsRatio } = req.body;

  const tpl = db.get("books").find({ id: templateId }).cloneDeep().value();
  tpl.id = createNewId();
  tpl.name = name;
  tpl._words = _.sampleSize(
    tpl._words,
    _.round((tpl._words.length * wordsRatio) / 100)
  );
  db.get("books").push(tpl).write();

  res.json(
    makeResult({
      id: tpl.id,
      name: tpl.name,
    })
  );
});

// update
app.post("/api/books/:bookId", async (req, res) => {
  const { bookId } = req.params;
  const matched = findBook(bookId);
  if (matched && req.body) {
    const newDoc = req.body;
    const spec = newDoc.spec;
    if (spec && spec.startsWith(specPattern)) {
      db.get("books").find({ id: bookId }).assign(newDoc).write();
    }
    res.json(makeResult({ id: bookId }));
  } else {
    res.status(404).json(makeResult("doc not found", false));
  }
});

app.delete("/api/books/:bookId", async (req, res) => {
  const { bookId } = req.params;
  db.get("books").remove({ id: bookId }).write();
  res.json(makeResult());
});

// testing api
app.get("/api/ping", (req, res) => {
  res.send(makeResult("pong"));
});

app.get("/pages/*", function (req, res) {
  res.sendFile("index.html", { root: buildDir });
});

// forward to web app
app.use(express.static(buildDir));

app.listen(process.env.PORT || 7000);
