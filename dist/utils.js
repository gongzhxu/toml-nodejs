export const isDecimal = (char) => {
    return '0' <= char && char <= '9';
};
export const isHexadecimal = (char) => {
    return ('A' <= char && char <= 'Z') || ('a' <= char && char <= 'z') || ('0' <= char && char <= '9');
};
export const isOctal = (char) => {
    return '0' <= char && char <= '7';
};
export const isBinary = (char) => {
    return char === '0' || char === '1';
};
//# sourceMappingURL=utils.js.map