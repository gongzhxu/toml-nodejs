import { TOMLError } from '../errors';
const isYear = (value) => {
    return 0 <= value && value <= 9999;
};
const isMonth = (value) => {
    return 0 < value && value <= 12;
};
const isDay = (value) => {
    return 0 < value && value <= 31;
};
export class LocalDate {
    year;
    month;
    day;
    constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
    }
    static fromString(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new TOMLError(`invalid local date format "${value}"`);
        }
        const [year, month, day] = value.split('-').map((component) => parseInt(component, 10));
        if (!isYear(year) || !isMonth(month) || !isDay(day)) {
            throw new TOMLError(`invalid local date format "${value}"`);
        }
        return new LocalDate(year, month, day);
    }
}
//# sourceMappingURL=local-date.js.map