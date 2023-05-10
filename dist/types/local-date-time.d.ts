import { type Day, type Month } from './local-date';
import { type Hour, type Minute, type Second } from './local-time';
export declare class LocalDateTime {
    readonly year: number;
    readonly month: Month;
    readonly day: Day;
    readonly hour: Hour;
    readonly minute: Minute;
    readonly second: Second;
    readonly millisecond: number;
    private constructor();
    static fromString(value: string): LocalDateTime;
}
