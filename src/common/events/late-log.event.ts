export class LateLogEvent {
    constructor(
        public readonly userId: string,
        public readonly latenessMinutes: number,
        public readonly attendanceId: string,
    ) {}
}

export const LATE_LOG_EVENT = 'attendance.late';
