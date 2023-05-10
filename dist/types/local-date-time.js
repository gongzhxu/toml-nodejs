import { LocalDate } from './local-date';
import { LocalTime } from './local-time';
import { TOMLError } from '../errors';
export class LocalDateTime {
    year;
    month;
    day;
    hour;
    minute;
    second;
    millisecond;
    constructor(year, month, day, hour, minute, second, millisecond) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millisecond = millisecond;
    }
    static fromString(value) {
        // Per [...] ISO8601, the "T" [...] in this syntax may alternatively be lower case "t" [...]
        //
        // ISO 8601 defines date and time separated by "T".
        // Applications using this syntax may choose, for the sake of
        // readability, to specify a full-date and full-time separated by
        // (say) a space character.
        //
        // https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
        const components = value.split(/[tT ]/);
        if (components.length !== 2) {
            throw new TOMLError(`invalid local date-time format "${value}"`);
        }
        const date = LocalDate.fromString(components[0]);
        const time = LocalTime.fromString(components[1]);
        return new LocalDateTime(date.year, date.month, date.day, time.hour, time.minute, time.second, time.millisecond);
    }
}
//# sourceMappingURL=local-date-time.js.map