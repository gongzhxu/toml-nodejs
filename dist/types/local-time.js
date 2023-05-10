import { TOMLError } from '../errors';
const isHour = (value) => {
    return 0 <= value && value < 24;
};
const isMinute = (value) => {
    return 0 <= value && value < 60;
};
const isSecond = (value) => {
    return 0 <= value && value < 60;
};
export class LocalTime {
    hour;
    minute;
    second;
    millisecond;
    constructor(hour, minute, second, millisecond) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millisecond = millisecond;
        // If the value contains greater precision than the implementation
        // can support, the additional precision must be truncated, not rounded.
        //
        // https://toml.io/en/v1.0.0#local-time
        this.millisecond = parseInt(millisecond.toString(10).slice(0, 3), 10);
    }
    static fromString(value) {
        if (!/^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
            throw new TOMLError(`invalid local time format "${value}"`);
        }
        const components = value.split(':');
        const [hour, minute] = components.slice(0, 2).map((component) => parseInt(component, 10));
        const [second, millisecond] = components[2].split('.').map((component) => parseInt(component, 10));
        if (!isHour(hour) || !isMinute(minute) || !isSecond(second)) {
            throw new TOMLError(`invalid local time format "${value}"`);
        }
        return new LocalTime(hour, minute, second, isNaN(millisecond) ? 0 : millisecond);
    }
}
//# sourceMappingURL=local-time.js.map