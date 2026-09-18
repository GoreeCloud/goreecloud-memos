import test from "node:test";
import assert from "node:assert/strict";
import { parseSearchExpression } from "../src/app/search-expression.mjs";

test("plain search text remains a plain substring query", () => {
  assert.deepEqual(parseSearchExpression("alpha background"), {
    query: "alpha background",
    color: null,
    label: null,
    labelColor: null
  });
});

test("advanced fields parse deterministically and support quoted label names", () => {
  assert.deepEqual(parseSearchExpression('alpha color:blue label:"Project Work" label-color:purple'), {
    query: "alpha",
    color: "blue",
    label: "Project Work",
    labelColor: "purple"
  });
});

test("memo color expression supports explicit no-color", () => {
  assert.equal(parseSearchExpression("color:none").color, "none");
});

test("unknown colon tokens remain ordinary search text", () => {
  assert.equal(parseSearchExpression("https://example.test alpha").query, "https://example.test alpha");
});

test("invalid recognized expressions fail with deterministic messages", () => {
  assert.throws(() => parseSearchExpression("color:"), /color requires a value/);
  assert.throws(() => parseSearchExpression("color:cyan"), /color must be one of/);
  assert.throws(() => parseSearchExpression("label-color:none"), /label-color must be one of/);
  assert.throws(() => parseSearchExpression("label:Work label:Home"), /label may appear only once/);
  assert.throws(() => parseSearchExpression('label:"Project Work'), /unterminated quote/);
});
