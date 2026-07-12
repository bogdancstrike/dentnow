/** Reusable server-paginated table. Owns query state (page/size) and selection; the
 *  domain feature supplies columns and row actions. Stable `rowKey="id"`.
 */
import { Button, Space, Alert } from 'antd';
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
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {onCreate && (
          <Button type="primary" onClick={onCreate}>
            Adaugă
          </Button>
        )}
      </Space>
      {error && <Alert type="error" title={error} showIcon />}
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
          showSizeChanger: true,
          onChange: onPageChange,
        }}
      />
    </Space>
  );
}
