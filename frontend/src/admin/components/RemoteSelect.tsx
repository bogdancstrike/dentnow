/**
 * Async, searchable Select bound to an admin list endpoint. Use this ANYWHERE the user
 * must reference an existing entity (clinic, category, treatment, page, …) instead of
 * typing an id. Options are fetched once and filtered client-side; supports single or
 * multiple selection and is a controlled Ant Form field (pass through `value`/`onChange`).
 */
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import type { AdminClient } from '../api/adminClient';

interface RemoteSelectProps {
  client: AdminClient;
  endpoint: string; // e.g. /v1/admin/treatment-categories
  /** field on each row to show as the label (default: name || title || label) */
  labelKey?: string;
  valueKey?: string; // default: id
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  allowClear?: boolean;
}

interface Row {
  id: string;
  [k: string]: unknown;
}

function labelOf(row: Row, key?: string): string {
  if (key && row[key] != null) return String(row[key]);
  return String(row.name ?? row.title ?? row.label ?? row.slug ?? row.id);
}

export function RemoteSelect({
  client,
  endpoint,
  labelKey,
  valueKey = 'id',
  value,
  onChange,
  multiple,
  placeholder = 'Selectează…',
  allowClear = true,
}: RemoteSelectProps) {
  const query = useQuery({
    queryKey: ['admin', 'options', endpoint],
    queryFn: async () => (await client.get<{ items: Row[] }>(`${endpoint}?page_size=200`)).data.items ?? [],
    staleTime: 60_000,
  });

  const options = (query.data ?? []).map((row) => ({
    value: String(row[valueKey] ?? row.id),
    label: labelOf(row, labelKey),
  }));

  return (
    <Select
      showSearch={{ optionFilterProp: 'label' }}
      mode={multiple ? 'multiple' : undefined}
      loading={query.isLoading}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      style={{ width: '100%' }}
    />
  );
}
