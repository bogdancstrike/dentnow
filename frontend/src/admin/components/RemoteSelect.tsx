/**
 * Async, searchable Select bound to an admin list endpoint. Use this ANYWHERE the user
 * must reference an existing entity (clinic, category, treatment, page, …) instead of
 * typing an id. Options are fetched once and filtered client-side; supports single or
 * multiple selection and is a controlled Ant Form field (pass through `value`/`onChange`).
 */
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import type { AdminClient } from '../api/adminClient';

interface RemoteSelectProps {
  id?: string;
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
  disabled?: boolean;
  onOptionsLoaded?: (options: RemoteSelectOption[]) => void;
}

export interface RemoteSelectRow {
  id: string;
  [k: string]: unknown;
}

export interface RemoteSelectOption {
  value: string;
  label: string;
  row: RemoteSelectRow;
}

function labelOf(row: RemoteSelectRow, key?: string): string {
  if (key && row[key] != null) return String(row[key]);
  return String(row.name ?? row.title ?? row.label ?? row.slug ?? row.id);
}

export function RemoteSelect({
  id,
  client,
  endpoint,
  labelKey,
  valueKey = 'id',
  value,
  onChange,
  multiple,
  placeholder = 'Selectează…',
  allowClear = true,
  disabled = false,
  onOptionsLoaded,
}: RemoteSelectProps) {
  const query = useQuery({
    queryKey: ['admin', 'options', endpoint],
    queryFn: async () => (await client.get<{ items: RemoteSelectRow[] }>(`${endpoint}?page_size=200`)).data.items ?? [],
    staleTime: 60_000,
  });

  const options = useMemo<RemoteSelectOption[]>(() => (query.data ?? []).map((row) => ({
    value: String(row[valueKey] ?? row.id),
    label: labelOf(row, labelKey),
    row,
  })), [labelKey, query.data, valueKey]);

  useEffect(() => {
    onOptionsLoaded?.(options);
  }, [onOptionsLoaded, options]);

  return (
    <Select
      id={id}
      showSearch={{ optionFilterProp: 'label' }}
      mode={multiple ? 'multiple' : undefined}
      loading={query.isLoading}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      style={{ width: '100%' }}
    />
  );
}
