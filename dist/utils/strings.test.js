"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-env node */
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const strings_1 = require("./strings");
(0, node_test_1.default)('normalize removes accents, trims, and lowercases', () => {
    strict_1.default.equal((0, strings_1.normalize)(' ÁÉÍÓÚ '), 'aeiou');
});
