import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

// Loglar uchun interfeys
export interface HikvisionLog {
	DeviceID: number;
	CardNo: string;
	EventTime: Date;
	EventName: string;
}

@Injectable()
export class HikvisionService implements OnModuleInit {
	private readonly logger = new Logger(HikvisionService.name);
	private pool: sql.ConnectionPool | null = null; // null bilan boshlash xavfsizroq

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		// Docker konteyneri to'liq ko'tarilishi uchun biroz kutish foydali
		setTimeout(() => this.connectWithRetry(), 2000);
	}

	async connectWithRetry(retries = 5, delay = 5000): Promise<void> {
		const config: sql.config = {
			user: this.configService.get<string>('HIKVISION_USER'),
			password: this.configService.get<string>('HIKVISION_PASSWORD'),
			server: this.configService.get<string>('HIKVISION_HOST'),
			port: Number(this.configService.get<number>('HIKVISION_PORT')) || 1433,
			database: this.configService.get<string>('HIKVISION_DB') || 'master',
			options: {
				encrypt: false, // Hikvision uchun shart!
				trustServerCertificate: true, // Sertifikat xatosini chetlab o'tish
				enableArithAbort: true,
				// MSSQL Instance nomi bo'lsa (ba'zan shunday ulanadi):
				// instanceName: 'SQLEXPRESS'
			},
			connectionTimeout: 30000, // Vaqtni 30 soniyaga ko'tardik
			requestTimeout: 30000,
			pool: {
				max: 10,
				min: 0,
				idleTimeoutMillis: 30000,
			},
		};

		try {
			this.logger.log(`Connecting to Hikvision at ${config.server}:${config.port}...`);

			// Eski poolni yopish (agar bo'lsa)
			if (this.pool) await this.pool.close();

			this.pool = await new sql.ConnectionPool(config).connect();
			this.logger.log('✅ Connected to Hikvision Database');
		} catch (err) {
			if (retries > 0) {
				this.logger.error(
					`❌ Failed to connect to Hikvision DB (${retries} retries left): ${err instanceof Error ? err.message : String(err)}`,
				);
				await new Promise(res => setTimeout(res, delay));
				return this.connectWithRetry(retries - 1, delay);
			} else {
				this.logger.error('‼️ Max retries reached. Hikvision DB connection failed.');
			}
		}
	}

	async fetchLogs(lastSyncTime: Date): Promise<HikvisionLog[]> {
		// Pool mavjudligini va ulanganini tekshirish
		if (!this.pool || !this.pool.connected) {
			this.logger.warn('Hikvision DB not connected, skipping fetch...');
			return [];
		}

		try {
			const request = this.pool.request();
			const result = await request.input('lastSync', sql.DateTime, lastSyncTime).query(`
          SELECT 
             [CardNo]
            ,[EventTime]
            ,[DeviceID]
            ,[EventName]
          FROM [EventLog]
          WHERE [EventTime] > @lastSync
          ORDER BY [EventTime] ASC
        `);

			return result.recordset as HikvisionLog[];
		} catch (error) {
			this.logger.error('Error fetching logs from Hikvision', error);
			return [];
		}
	}
}
