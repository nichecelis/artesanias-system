"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// ─── Error de la app ─────────────────────────────────────────
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=index.js.map