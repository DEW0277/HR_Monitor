import { Injectable, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { hikvisionConfig } from '../../config/hikvision.config';

export interface HikvisionLog {
  DeviceID: number;
  CardNo: string;
  EventTime: Date;
  EventName: string;
}

@Injectable()
export class HikvisionService {
  private readonly logger = new Logger(HikvisionService.name);
  private pool!: sql.ConnectionPool;

  constructor() {
    this.connectWithRetry();
  }

  async connectWithRetry(retries = 5, delay = 5000): Promise<void> {
    try {
      this.pool = await new sql.ConnectionPool(hikvisionConfig).connect();
      this.logger.log('Connected to Hikvision Database');
    } catch (err) {
      if (retries > 0) {
        this.logger.error(`Failed to connect to Hikvision DB (${retries} retries left): ${err instanceof Error ? err.message : String(err)}`);
        await new Promise(res => setTimeout(res, delay));
        return this.connectWithRetry(retries - 1, delay);
      } else {
        this.logger.error('Max retries reached. Hikvision DB connection failed.', err);
      }
    }
  }

  async fetchLogs(lastSyncTime: Date): Promise<HikvisionLog[]> {
    if (!this.pool || !this.pool.connected) {
      this.logger.warn('Hikvision DB not connected, attempting reconnect...');
      await this.connectWithRetry(3, 2000); // Shorter retry for fetch
      if (!this.pool || !this.pool.connected) return [];
    }

    try {
      const request = this.pool.request();
      // Adjust table name based on actual Hikvision DB schema. Usually implies 'KeepEvent' or 'EventLog'
      // This query is a placeholder and should be adjusted to the real schema.
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
