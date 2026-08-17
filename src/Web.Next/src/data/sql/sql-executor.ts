export type SqlParameter = string | number | boolean | Date | null;

export type SqlRow = Record<string, unknown>;

export type SqlQueryResult = {
  rows: SqlRow[];
  rowsAffected: number;
};

/**
 * Minimal SQL executor. Keeps repository code independent of the `mssql` package types.
 */
export interface SqlExecutor {
  query(sql: string, params?: SqlParameter[]): Promise<SqlQueryResult>;
  /**
   * Run work inside a transaction. Nested calls reuse the same transaction.
   * On throw, the transaction is rolled back.
   */
  transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}
