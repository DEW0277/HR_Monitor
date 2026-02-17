"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LATE_LOG_EVENT = exports.LateLogEvent = void 0;
class LateLogEvent {
    constructor(userId, latenessMinutes, attendanceId) {
        this.userId = userId;
        this.latenessMinutes = latenessMinutes;
        this.attendanceId = attendanceId;
    }
}
exports.LateLogEvent = LateLogEvent;
exports.LATE_LOG_EVENT = 'attendance.late';
//# sourceMappingURL=late-log.event.js.map