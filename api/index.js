// import fs from "fs/promises";
// import fsLegacy from "fs";
import path from "path";
import process from "process";
import express from "express";
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
class Dao {
    constructor() {
        this.getAllBooks = () => this.db.get("books");
        this.findBook = (bookId) => this.getAllBooks().find({ id: bookId });
        const adapter = new FileSync(path.join(dataDir, dataFile));
        this.db = low(adapter);
    }
}
const dao = new Dao();
const app = express();
app.use(express.json({
    limit: "2mb",
}));
const makeResult = (payload = undefined, result = true) => {
    if (result) {
        return {
            status: "ok",
            error: undefined,
            data: payload,
        };
    }
    else {
        return {
            status: "error",
            error: payload,
            data: undefined,
        };
    }
};
app.get("/api/books", async (req, res) => {
    const result = [];
    for (const book of dao.getAllBooks().value()) {
        result.push({
            id: book.id,
            name: book.name,
            wordCount: book._words.length,
            version: book.version,
        });
    }
    const sortedBooks = _.sortBy(result, (item) => -item.version);
    res.json(makeResult(sortedBooks));
});
// get state
app.get("/api/books/:bookId", (req, res) => {
    const matched = dao.findBook(req.params.bookId).value();
    if (matched) {
        res.json(makeResult(matched));
    }
    else {
        res.status(404).json(makeResult("no such book.", false));
    }
});
const createNewId = (name) => {
    if (name?.match(/^[a-z]+$/gi)) {
        return name;
    }
    else {
        return nanoid();
    }
};
// create by template
app.post("/api/books", async (req, res) => {
    const { templateId, name, wordsRatio } = req.body;
    const tpl = dao.getAllBooks().find({ id: templateId }).cloneDeep().value();
    tpl.id = createNewId();
    tpl.name = name;
    tpl._words = _.sampleSize(tpl._words, _.round((tpl._words.length * wordsRatio) / 100));
    dao.getAllBooks().push(tpl).write();
    res.json(makeResult({
        id: tpl.id,
        name: tpl.name,
    }));
});
// update
app.post("/api/books/:bookId", async (req, res) => {
    const { bookId } = req.params;
    const matched = dao.findBook(bookId).value();
    if (matched && req.body) {
        const newDoc = req.body;
        const spec = newDoc.spec;
        if (spec && spec.startsWith(specPattern)) {
            dao.getAllBooks().find({ id: bookId }).assign(newDoc).write();
        }
        // res.status(404).json(makeResult("doc not found", false));
        res.json(makeResult({ id: bookId }));
    }
    else {
        res.status(404).json(makeResult("doc not found", false));
    }
});
app.delete("/api/books/:bookId", async (req, res) => {
    const { bookId } = req.params;
    dao.getAllBooks().remove({ id: bookId }).write();
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
const listeningPort = process.env.PORT ?? 7000;
log.info("Listening on port", listeningPort);
app.listen(listeningPort);
