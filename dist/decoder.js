import { Parser } from './parser';
import { normalize } from './normalizer';
export const decode = (input) => {
    const parser = new Parser(input);
    const node = parser.parse();
    return normalize(node);
};
//# sourceMappingURL=decoder.js.map