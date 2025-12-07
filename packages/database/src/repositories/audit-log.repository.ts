import { BaseRepository } from './base.repository';

export interface CreateAuditLogData {
  userId: number | null;
  action: string;
  resourceType?: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
}

/**
 * AuditLogRepository - Handles audit log operations
 */
export class AuditLogRepository extends BaseRepository {
  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData): Promise<void> {
    await this.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.userId,
        data.action,
        data.resourceType,
        data.resourceId,
        JSON.stringify(data.details),
        data.ipAddress,
      ]
    );
  }
}
