import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<T> {
  constructor(
    protected supabase: SupabaseClient,
    protected tableName: string
  ) {}

  protected handleError(error: any): never {
    console.error(`Error in ${this.tableName} repository:`, error);
    throw error;
  }

  protected async executeQuery<R>(
    queryFn: () => { data: R | null; error: any }
  ): Promise<R | null> {
    try {
      const { data, error } = queryFn();
      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async executeQueryArray<R>(
    queryFn: () => { data: R[] | null; error: any }
  ): Promise<R[]> {
    try {
      const { data, error } = queryFn();
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async executeMutation<R>(
    mutationFn: () => { data: R | null; error: any }
  ): Promise<R> {
    try {
      const { data, error } = mutationFn();
      if (error) throw error;
      if (!data) throw new Error(`No data returned from ${this.tableName} mutation`);
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async executeDelete(
    deleteFn: () => { error: any }
  ): Promise<void> {
    try {
      const { error } = deleteFn();
      if (error) throw error;
    } catch (error) {
      this.handleError(error);
    }
  }
}
