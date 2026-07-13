/** Reusable server-paginated table. Owns query state (page/size) and selection; the
 *  domain feature supplies columns and row actions. Stable `rowKey="id"`.
 */
import { Button, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SortableResourceTable } from './SortableResourceTable';

export interface ResourceRow {
  id: string;
  [key: string]: unknown;
}

interface Props<T extends ResourceRow> {
  columns: ColumnsType<T>;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  error?: string | null;
  title: string;
  onCreate?: () => void;
  onPageChange: (page: number, pageSize: number) => void;
  onReorder?: (rows: T[]) => void | Promise<void>;
  reordering?: boolean;
}

export function ResourceTable<T extends ResourceRow>({
  columns,
  data,
  total,
  page,
  pageSize,
  loading,
  error,
  title,
  onCreate,
  onPageChange,
  onReorder,
  reordering,
}: Props<T>) {
  return (
    <section className="admin-resource-stack">
      <header className="admin-resource-header">
        <h2 style={{ margin: 0 }}>{title}</h2>
        {onCreate && (
          <Button type="primary" onClick={onCreate}>
            Adaugă
          </Button>
        )}
      </header>
      {error && <Alert type="error" title={error} showIcon />}
      <span className="admin-table-scroll-hint">Glisează orizontal pentru a vedea toate coloanele.</span>
      <SortableResourceTable<T>
        columns={columns}
        data={data}
        onReorder={onReorder}
        reordering={reordering}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          responsive: true,
          showLessItems: true,
          showSizeChanger: true,
          onChange: onPageChange,
        }}
      />
    </section>
  );
}
