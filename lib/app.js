"use strict";
const koa = require("koa");
const multipart = require("co-multipart");
const rimraf = require("rimraf-then");
const mkdirp = require("mkdirp-then");
const exec = require("child-process-promise").exec;
const error = require("koa-error");

const config = require("../config.json");
const wattsiPath = config.wattsiPath;

const app = koa();

app.use(error());

app.use(function* () {
  const parts = yield* multipart(this);

  if (!parts.file.source) {
    this.throw("Expected a source file", 400);
  }
  const sourceFilePath = parts.file.source.path;

  // TODO: get these from local or remote copies if not supplied.

  if (!parts.file.caniuse) {
    this.throw("Expected caniuse file", 400);
  }
  const caniuseFilePath = parts.file.caniuse.path;

  if (!parts.file.w3cbugs) {
    this.throw("Expected w3cbugs file", 400);
  }
  const w3cbugsFilePath = parts.file.w3cbugs.path;

  const outDirectory = randomDirectoryName();
  yield mkdirp(outDirectory);

  try {
    yield exec(wattsiPath, [sourceFilePath, outDirectory, caniuseFilePath, w3cbugsFilePath]);
    yield exec("zip", ["-r", outDirectory, `${outDirectory}.zip`]);
  } finally {
    yield rimraf(outDirectory);
  }
});

app.listen(3000);

function randomDirectoryName() {
  return Math.random().toString(36).slice(2);
}
