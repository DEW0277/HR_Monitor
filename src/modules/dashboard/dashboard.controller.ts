import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TwaAuthGuard } from './twa-auth.guard';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(TwaAuthGuard)
  async getStats() {
    return this.dashboardService.getDailyStats();
  }

  @Get('users')
  @UseGuards(TwaAuthGuard)
  async getUsers() {
    return this.dashboardService.getUsersList();
  }
}
