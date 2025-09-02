import { BaseRepository } from './base.repository';
import { SyncLog, InsertSyncLog, UpdateSyncLog } from '@/types/database';

export class SyncLogRepository extends BaseRepository<SyncLog> {
  constructor(supabase: any) {
    super(supabase, 'sync_logs');
  }

  async getById(id: string): Promise<SyncLog | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async getByOrganization(organizationId: string, limit = 50): Promise<SyncLog[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .order('started_at', { ascending: false })
        .limit(limit)
    );
  }

  async getByType(organizationId: string, syncType: string, limit = 50): Promise<SyncLog[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('sync_type', syncType)
        .order('started_at', { ascending: false })
        .limit(limit)
    );
  }

  async getByStatus(organizationId: string, status: string, limit = 50): Promise<SyncLog[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', status)
        .order('started_at', { ascending: false })
        .limit(limit)
    );
  }

  async getRecentFailures(organizationId: string, daysBack = 7, limit = 20): Promise<SyncLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'failed')
        .gte('started_at', cutoffDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(limit)
    );
  }

  async create(syncLog: InsertSyncLog): Promise<SyncLog> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .insert(syncLog)
        .select()
        .single()
    );
  }

  async update(id: string, updates: UpdateSyncLog): Promise<SyncLog> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async complete(id: string, recordsProcessed: number, executionTimeMs: number, errorMessage?: string): Promise<void> {
    const updates: UpdateSyncLog = {
      status: errorMessage ? 'failed' : 'completed',
      records_processed: recordsProcessed,
      execution_time_ms: executionTimeMs,
      error_message: errorMessage,
      completed_at: new Date().toISOString()
    };

    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
    );
  }

  async markRunning(id: string): Promise<void> {
    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .update({ status: 'running' })
        .eq('id', id)
    );
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .update({ 
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
    );
  }

  async getStats(organizationId: string, daysBack = 30): Promise<{
    total: number;
    successful: number;
    failed: number;
    running: number;
    averageExecutionTime: number;
    totalRecordsProcessed: number;
    byType: Record<string, number>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const allLogs = await this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .gte('started_at', cutoffDate.toISOString())
    );

    const stats = {
      total: allLogs.length,
      successful: allLogs.filter(log => log.status === 'completed').length,
      failed: allLogs.filter(log => log.status === 'failed').length,
      running: allLogs.filter(log => log.status === 'running').length,
      averageExecutionTime: 0,
      totalRecordsProcessed: 0,
      byType: {} as Record<string, number>
    };

    let totalExecutionTime = 0;
    let executionTimeCount = 0;

    allLogs.forEach(log => {
      stats.totalRecordsProcessed += log.records_processed;
      stats.byType[log.sync_type] = (stats.byType[log.sync_type] || 0) + 1;
      
      if (log.execution_time_ms) {
        totalExecutionTime += log.execution_time_ms;
        executionTimeCount++;
      }
    });

    if (executionTimeCount > 0) {
      stats.averageExecutionTime = Math.round(totalExecutionTime / executionTimeCount);
    }

    return stats;
  }

  async cleanupOldLogs(organizationId: string, daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('organization_id', organizationId)
      .lt('started_at', cutoffDate.toISOString())
      .select('id');

    if (error) this.handleError(error);
    return data?.length || 0;
  }

  async getLongRunningSyncs(organizationId: string, maxDurationMinutes = 60): Promise<SyncLog[]> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - maxDurationMinutes);

    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'running')
        .lt('started_at', cutoffTime.toISOString())
        .order('started_at', { ascending: true })
    );
  }
}
