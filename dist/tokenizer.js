import { TOMLError } from './errors';
import { isHexadecimal } from './utils';
const EOF = -1;
const isBare = (char) => {
    return (('A' <= char && char <= 'Z') ||
        ('a' <= char && char <= 'z') ||
        ('0' <= char && char <= '9') ||
        char === '-' ||
        char === '_');
};
// Whitespace means tab (0x09) or space (0x20).
//
// https://toml.io/en/v1.0.0#spec
const isWhitespace = (char) => {
    return char === ' ' || char === '\t';
};
const isUnicodeCharacter = (char) => {
    return char <= '\u{10ffff}';
};
const isControlCharacter = (char) => {
    return ('\u{0}' <= char && char < '\u{20}') || char === '\u{7f}';
};
const isControlCharacterOtherThanTab = (char) => {
    return isControlCharacter(char) && char !== '\t';
};
const PUNCTUATOR_OR_NEWLINE_TOKENS = {
    '\n': 'NEWLINE',
    '=': 'EQUALS',
    '.': 'PERIOD',
    ',': 'COMMA',
    ':': 'COLON',
    '+': 'PLUS',
    '{': 'LEFT_CURLY_BRACKET',
    '}': 'RIGHT_CURLY_BRACKET',
    '[': 'LEFT_SQUARE_BRACKET',
    ']': 'RIGHT_SQUARE_BRACKET',
};
const isPunctuatorOrNewline = (char) => {
    return char in PUNCTUATOR_OR_NEWLINE_TOKENS;
};
// For convenience, some popular characters have a compact escape sequence.
//
// \b         - backspace       (U+0008)
// \t         - tab             (U+0009)
// \n         - linefeed        (U+000A)
// \f         - form feed       (U+000C)
// \r         - carriage return (U+000D)
// \"         - quote           (U+0022)
// \\         - backslash       (U+005C)
//
// https://toml.io/en/v1.0.0#string
const ESCAPES = {
    'b': '\b',
    't': '\t',
    'n': '\n',
    'f': '\f',
    'r': '\r',
    '"': '"',
    '\\': '\\',
};
const isEscaped = (char) => {
    return char in ESCAPES;
};
class InputIterator {
    input;
    pos = -1;
    constructor(input) {
        this.input = input;
    }
    peek() {
        const pos = this.pos;
        const char = this.next();
        this.pos = pos;
        return char;
    }
    take(...chars) {
        const char = this.peek();
        if (char !== EOF && chars.includes(char)) {
            this.next();
            return true;
        }
        return false;
    }
    next() {
        if (this.pos + 1 === this.input.length) {
            return EOF;
        }
        this.pos++;
        const char = this.input[this.pos];
        if (char === '\r' && this.input[this.pos + 1] === '\n') {
            this.pos++;
            return '\n';
        }
        return char;
    }
}
export class Tokenizer {
    input;
    iterator;
    constructor(input) {
        this.input = input;
        this.iterator = new InputIterator(input);
    }
    peek() {
        const pos = this.iterator.pos;
        try {
            const token = this.next();
            this.iterator.pos = pos;
            return token;
        }
        catch (err) {
            this.iterator.pos = pos;
            throw err;
        }
    }
    take(...types) {
        const token = this.peek();
        if (types.includes(token.type)) {
            this.next();
            return true;
        }
        return false;
    }
    assert(...types) {
        if (!this.take(...types)) {
            throw new TOMLError();
        }
    }
    expect(type) {
        const token = this.next();
        if (token.type !== type) {
            throw new TOMLError();
        }
        return token;
    }
    sequence(...types) {
        return types.map((type) => this.expect(type));
    }
    next() {
        const char = this.iterator.next();
        const start = this.iterator.pos;
        if (isPunctuatorOrNewline(char)) {
            return { type: PUNCTUATOR_OR_NEWLINE_TOKENS[char], value: char };
        }
        if (isBare(char)) {
            return this.scanBare(start);
        }
        switch (char) {
            case ' ':
            case '\t':
                return this.scanWhitespace(start);
            case '#':
                return this.scanComment(start);
            case "'":
                return this.scanLiteralString();
            case '"':
                return this.scanBasicString();
            case EOF:
                return { type: 'EOF' };
        }
        throw new TOMLError();
    }
    scanBare(start) {
        while (isBare(this.iterator.peek())) {
            this.iterator.next();
        }
        return { type: 'BARE', value: this.input.slice(start, this.iterator.pos + 1) };
    }
    scanWhitespace(start) {
        while (isWhitespace(this.iterator.peek())) {
            this.iterator.next();
        }
        return { type: 'WHITESPACE', value: this.input.slice(start, this.iterator.pos + 1) };
    }
    scanComment(start) {
        for (;;) {
            const char = this.iterator.peek();
            // Control characters other than tab (U+0000 to U+0008, U+000A to U+001F, U+007F) are not permitted in comments.
            //
            // https://toml.io/en/v1.0.0#comment
            if (isUnicodeCharacter(char) && !isControlCharacterOtherThanTab(char)) {
                this.iterator.next();
                continue;
            }
            return { type: 'COMMENT', value: this.input.slice(start, this.iterator.pos + 1) };
        }
    }
    scanString(delimiter) {
        let isMultiline = false;
        if (this.iterator.take(delimiter)) {
            if (!this.iterator.take(delimiter)) {
                return { type: 'STRING', value: '', isMultiline: false };
            }
            isMultiline = true;
        }
        // A newline immediately following the opening delimiter will be trimmed.
        //
        // https://toml.io/en/v1.0.0#string
        if (isMultiline) {
            this.iterator.take('\n');
        }
        let value = '';
        for (;;) {
            const char = this.iterator.next();
            switch (char) {
                case '\n':
                    if (!isMultiline) {
                        throw new TOMLError();
                    }
                    value += char;
                    continue;
                case delimiter:
                    if (isMultiline) {
                        if (!this.iterator.take(delimiter)) {
                            value += delimiter;
                            continue;
                        }
                        if (!this.iterator.take(delimiter)) {
                            value += delimiter;
                            value += delimiter;
                            continue;
                        }
                        if (this.iterator.take(delimiter)) {
                            value += delimiter;
                        }
                        if (this.iterator.take(delimiter)) {
                            value += delimiter;
                        }
                    }
                    break;
                case undefined:
                    throw new TOMLError();
                default:
                    if (isControlCharacterOtherThanTab(char)) {
                        throw new TOMLError();
                    }
                    switch (delimiter) {
                        case "'":
                            value += char;
                            continue;
                        case '"':
                            if (char === '\\') {
                                const char = this.iterator.next();
                                if (isEscaped(char)) {
                                    value += ESCAPES[char];
                                    continue;
                                }
                                // Any Unicode character may be escaped with the \uXXXX or \UXXXXXXXX forms.
                                // The escape codes must be valid Unicode scalar values.
                                //
                                // https://toml.io/en/v1.0.0#string
                                if (char === 'u' || char === 'U') {
                                    const size = char === 'u' ? 4 : 8;
                                    let codePoint = '';
                                    for (let i = 0; i < size; i++) {
                                        const char = this.iterator.next();
                                        if (char === EOF || !isHexadecimal(char)) {
                                            throw new TOMLError();
                                        }
                                        codePoint += char;
                                    }
                                    const result = String.fromCodePoint(parseInt(codePoint, 16));
                                    if (!isUnicodeCharacter(result)) {
                                        throw new TOMLError();
                                    }
                                    value += result;
                                    continue;
                                }
                                // For writing long strings without introducing extraneous whitespace, use a "line ending backslash".
                                // When the last non-whitespace character on a line is an unescaped \, it will be trimmed along with all
                                // whitespace (including newlines) up to the next non-whitespace character or closing delimiter.
                                //
                                // https://toml.io/en/v1.0.0#string
                                if (isMultiline && (isWhitespace(char) || char === '\n')) {
                                    while (this.iterator.take(' ', '\t', '\n')) {
                                        //
                                    }
                                    continue;
                                }
                                throw new TOMLError();
                            }
                            value += char;
                            continue;
                    }
            }
            break;
        }
        return { type: 'STRING', value, isMultiline };
    }
    scanLiteralString() {
        return this.scanString("'");
    }
    scanBasicString() {
        return this.scanString('"');
    }
}
//# sourceMappingURL=tokenizer.js.map