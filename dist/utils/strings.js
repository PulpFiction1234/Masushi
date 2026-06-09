"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = void 0;
// Normaliza strings: sin tildes, trim y lowercase
const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
exports.normalize = normalize;
