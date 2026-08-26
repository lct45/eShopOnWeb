import sql from "mssql";
import type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
} from "@/data/sql/sql-executor";

export type MssqlConnectionConfig = {
  connectionString: string;
};

type RequestLike = {
  input(name: string, value: SqlParameter): void;
  query(sqlText: string): Promise<{
    recordset: Record<string, unknown>[];
    rowsAffected: number[];
  }>;
};

type TransactionLike = {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  request(): RequestLike;
};

type PoolLike = {
  request(): RequestLike;
  transaction(): TransactionLike;
  close(): Promise<void>;
  connected: boolean;
};

function rewritePlaceholders(
  sqlText: string,
  request: RequestLike,
  params: SqlParameter[],
): string {
  let rewritten = sqlText;
  params.forEach((value, i) => {
    const name = `p${i}`;
    request.input(name, value);
    rewritten = rewritten.replace("?", `@${name}`);
  });
  return rewritten;
}

class MssqlExecutor implements SqlExecutor {
  constructor(
    private readonly pool: PoolLike,
    private readonly activeTx: TransactionLike | null = null,
  ) {}

  private createRequest(): RequestLike {
    return this.activeTx ? this.activeTx.request() : this.pool.request();
  }

  async query(
    sqlText: string,
    params: SqlParameter[] = [],
  ): Promise<SqlQueryResult> {
    const request = this.createRequest();
    const rewritten = rewritePlaceholders(sqlText, request, params);
    const result = await request.query(rewritten);
    return {
      rows: result.recordset ?? [],
      rowsAffected: result.rowsAffected?.reduce((a, b) => a + b, 0) ?? 0,
    };
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    if (this.activeTx) {
      return work(this);
    }

    const tx = this.pool.transaction();
    await tx.begin();
    const executor = new MssqlExecutor(this.pool, tx);
    try {
      const result = await work(executor);
      await tx.commit();
      return result;
    } catch (error) {
      try {
        await tx.rollback();
      } catch {
        // Swallow rollback errors so the original failure surfaces.
      }
      throw error;
    }
  }
}

export class MssqlClient implements SqlExecutor {
  private pool: PoolLike | null = null;
  private root: MssqlExecutor | null = null;

  constructor(private readonly config: MssqlConnectionConfig) {}

  async connect(): Promise<SqlExecutor> {
    if (!this.pool?.connected) {
      this.pool = (await sql.connect(
        this.config.connectionString,
      )) as unknown as PoolLike;
      this.root = new MssqlExecutor(this.pool);
    }
    return this.root!;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.root = null;
    }
  }

  async query(
    sqlText: string,
    params?: SqlParameter[],
  ): Promise<SqlQueryResult> {
    const executor = await this.connect();
    return executor.query(sqlText, params);
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    const executor = await this.connect();
    return executor.transaction(work);
  }
}

export function getIdentityConnectionString(): string | undefined {
  return (
    process.env.IDENTITY_SQL_CONNECTION_STRING ??
    process.env.ESHOP_IDENTITY_CONNECTION_STRING ??
    undefined
  );
}
