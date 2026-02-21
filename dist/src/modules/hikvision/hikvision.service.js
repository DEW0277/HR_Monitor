"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HikvisionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HikvisionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sql = require("mssql");
let HikvisionService = HikvisionService_1 = class HikvisionService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HikvisionService_1.name);
    }
    async onModuleInit() {
        await this.connectWithRetry();
    }
    async connectWithRetry(retries = 5, delay = 5000) {
        const config = {
            user: this.configService.get('HIKVISION_USER'),
            password: this.configService.get('HIKVISION_PASSWORD'),
            server: this.configService.get('HIKVISION_HOST'),
            port: Number(this.configService.get('HIKVISION_PORT')) || 1433,
            database: this.configService.get('HIKVISION_DB') || 'master',
            options: {
                encrypt: false,
                trustServerCertificate: true,
            },
            connectionTimeout: 15000,
        };
        try {
            this.logger.log(`Connecting to Hikvision at ${config.server}:${config.port}...`);
            this.pool = await new sql.ConnectionPool(config).connect();
            this.logger.log('Connected to Hikvision Database');
        }
        catch (err) {
            if (retries > 0) {
                this.logger.error(`Failed to connect to Hikvision DB (${retries} retries left): ${err instanceof Error ? err.message : String(err)}`);
                await new Promise(res => setTimeout(res, delay));
                return this.connectWithRetry(retries - 1, delay);
            }
            else {
                this.logger.error('Max retries reached. Hikvision DB connection failed.');
            }
        }
    }
    async fetchLogs(lastSyncTime) {
        if (!this.pool || !this.pool.connected) {
            this.logger.warn('Hikvision DB not connected, attempting reconnect...');
            await this.connectWithRetry(3, 2000);
            if (!this.pool || !this.pool.connected)
                return [];
        }
        try {
            const request = this.pool.request();
            const result = await request.query `
        SELECT 
           [CardNo]
          ,[EventTime]
          ,[DeviceID]
          ,[EventName]
        FROM [EventLog]
        WHERE [EventTime] > ${lastSyncTime}
        ORDER BY [EventTime] ASC
      `;
            return result.recordset;
        }
        catch (error) {
            this.logger.error('Error fetching logs from Hikvision', error);
            return [];
        }
    }
};
exports.HikvisionService = HikvisionService;
exports.HikvisionService = HikvisionService = HikvisionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HikvisionService);
//# sourceMappingURL=hikvision.service.js.map