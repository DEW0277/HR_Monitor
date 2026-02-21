import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

export interface HikvisionLog {
	DeviceID: number;
	CardNo: string;
	EventTime: Date;
	EventName: string;
}

@Injectable()
export class HikvisionService implements OnModuleInit {
	private readonly logger = new Logger(HikvisionService.name);
	private pool!: sql.ConnectionPool;

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		await this.connectWithRetry();
	}

	async connectWithRetry(retries = 5, delay = 5000): Promise<void> {
		const config: sql.config = {
			user: this.configService.get<string>('HIKVISION_USER'),
			password: this.configService.get<string>('HIKVISION_PASSWORD'),
			server: this.configService.get<string>('HIKVISION_HOST'),
			port: Number(this.configService.get<number>('HIKVISION_PORT')) || 1433,
			database: this.configService.get<string>('HIKVISION_DB') || 'master',
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
		} catch (err) {
			if (retries > 0) {
				this.logger.error(
					`Failed to connect to Hikvision DB (${retries} retries left): ${err instanceof Error ? err.message : String(err)}`,
				);
				await new Promise(res => setTimeout(res, delay));
				return this.connectWithRetry(retries - 1, delay);
			} else {
				this.logger.error('Max retries reached. Hikvision DB connection failed.');
			}
		}
	}

	// MANA SHU FUNKSIYA ETISHMAYOTGAN EDI:
	async fetchLogs(lastSyncTime: Date): Promise<HikvisionLog[]> {
		if (!this.pool || !this.pool.connected) {
			this.logger.warn('Hikvision DB not connected, attempting reconnect...');
			await this.connectWithRetry(3, 2000);
			if (!this.pool || !this.pool.connected) return [];
		}

		try {
			const request = this.pool.request();
			// SQL so'rovi
			const result = await request.query`
        SELECT 
           [CardNo]
          ,[EventTime]
          ,[DeviceID]
          ,[EventName]
        FROM [EventLog]
        WHERE [EventTime] > ${lastSyncTime}
        ORDER BY [EventTime] ASC
      `;

			return result.recordset as HikvisionLog[];
		} catch (error) {
			this.logger.error('Error fetching logs from Hikvision', error);
			return [];
		}
	}
}
