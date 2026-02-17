export declare class LateLogEvent {
    readonly userId: string;
    readonly latenessMinutes: number;
    readonly attendanceId: string;
    constructor(userId: string, latenessMinutes: number, attendanceId: string);
}
export declare const LATE_LOG_EVENT = "attendance.late";
