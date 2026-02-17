"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hikvisionConfig = void 0;
exports.hikvisionConfig = {
    user: process.env.HIKVISION_DB_USER || 'sa',
    password: process.env.HIKVISION_DB_PASSWORD || 'Hikvision123',
    server: process.env.HIKVISION_DB_HOST || '192.168.1.200',
    database: process.env.HIKVISION_DB_NAME || 'ivms_db',
    port: parseInt(process.env.HIKVISION_DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        debug: {
            packet: true,
            data: true,
            payload: true,
            token: false,
            log: true
        },
    },
};
//# sourceMappingURL=hikvision.config.js.map