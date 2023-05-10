export class TOMLError extends Error {
    constructor(message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}
//# sourceMappingURL=errors.js.map