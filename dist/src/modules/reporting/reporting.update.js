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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingUpdate = void 0;
const nestjs_1 = require("@grammyjs/nestjs");
const grammy_1 = require("grammy");
const reporting_service_1 = require("./reporting.service");
let ReportingUpdate = class ReportingUpdate {
    constructor(reportingService) {
        this.reportingService = reportingService;
    }
    async onForceReport(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        await ctx.reply('Generating daily report...');
        await this.reportingService.generateAndSendReport();
        await ctx.reply('Report sent to management group.');
    }
};
exports.ReportingUpdate = ReportingUpdate;
__decorate([
    (0, nestjs_1.Command)('force_report'),
    __param(0, (0, nestjs_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [grammy_1.Context]),
    __metadata("design:returntype", Promise)
], ReportingUpdate.prototype, "onForceReport", null);
exports.ReportingUpdate = ReportingUpdate = __decorate([
    (0, nestjs_1.Update)(),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingUpdate);
//# sourceMappingURL=reporting.update.js.map