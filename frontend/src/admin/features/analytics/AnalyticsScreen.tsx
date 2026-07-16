import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Popconfirm,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import {
  AnalyticsOverviewSchema,
  type AnalyticsDimension,
} from './analyticsContracts';
import { GeographyCharts, TrafficTrendChart } from './AnalyticsCharts';
import './AnalyticsScreen.css';

const { RangePicker } = DatePicker;
const numberFormatter = new Intl.NumberFormat('ro-RO');

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateRange(params: URLSearchParams): { from: string; to: string; preset: string } {
  const preset = params.get('range') ?? '30';
  const to = new Date();
  if (preset === 'custom') {
    if (params.get('from') && params.get('to')) {
      return { from: params.get('from')!, to: params.get('to')!, preset };
    }
    const from = new Date(to);
    from.setDate(from.getDate() - 30 + 1);
    return { from: isoDate(from), to: isoDate(to), preset: 'custom' };
  }
  const days = Math.max(1, Number(preset) || 30);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  return { from: isoDate(from), to: isoDate(to), preset: String(days) };
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="analytics-delta analytics-delta--neutral">Fără comparație</span>;
  return (
    <span className={`analytics-delta ${value >= 0 ? 'analytics-delta--up' : 'analytics-delta--down'}`}>
      {value >= 0 ? '↑' : '↓'} {Math.abs(value).toLocaleString('ro-RO')}% față de perioada anterioară
    </span>
  );
}

function Breakdown({ title, items }: { title: string; items: AnalyticsDimension[] }) {
  const max = Math.max(1, ...items.map((item) => item.visitors));
  return (
    <Card className="analytics-panel" title={title}>
      {items.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nu există date" /> : (
        <div className="analytics-breakdown">
          {items.slice(0, 8).map((item) => (
            <div className="analytics-breakdown__row" key={item.key}>
              <div><strong>{item.key}</strong><span>{numberFormatter.format(item.visitors)} vizitatori</span></div>
              <div className="analytics-breakdown__track"><i style={{ width: `${item.visitors * 100 / max}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const dimensionColumns: ColumnsType<AnalyticsDimension> = [
  { title: 'Element', dataIndex: 'key', key: 'key', ellipsis: true },
  { title: 'Vizualizări', dataIndex: 'views', key: 'views', align: 'right', render: (value: number) => numberFormatter.format(value), sorter: (a, b) => a.views - b.views },
  { title: 'Vizitatori', dataIndex: 'visitors', key: 'visitors', align: 'right', render: (value: number) => numberFormatter.format(value), sorter: (a, b) => a.visitors - b.visitors },
];

function ContentTable({ title, items }: { title: string; items: AnalyticsDimension[] }) {
  return (
    <Card className="analytics-panel" title={title}>
      <Table
        className="admin-responsive-table"
        rowKey="key"
        columns={dimensionColumns}
        dataSource={items}
        pagination={{ pageSize: 8, hideOnSinglePage: true, responsive: true, showLessItems: true }}
        scroll={{ x: 480 }}
        size="small"
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nu există activitate" /> }}
      />
    </Card>
  );
}

export function AnalyticsScreen({ client }: { client: AdminClient }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = useMemo(() => dateRange(searchParams), [searchParams]);
  const query = useQuery({
    queryKey: ['admin', 'analytics', range.from, range.to],
    queryFn: async () => {
      const { data } = await client.get<unknown>(`/v1/admin/analytics/overview?from=${range.from}&to=${range.to}`);
      return AnalyticsOverviewSchema.parse(data);
    },
  });

  useEffect(() => {
    if (query.data && searchParams.get('view') === 'articles') {
      document.getElementById('analytics-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [query.data, searchParams]);

  const setPreset = (value: string | number) => {
    const preset = String(value);
    if (preset === 'custom') setSearchParams({ range: 'custom' });
    else setSearchParams({ range: preset });
  };
  const exportCsv = async () => {
    const blob = await client.download(`/v1/admin/analytics/export.csv?from=${range.from}&to=${range.to}`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dentnow-analytics-${range.from}-${range.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const handleReset = async () => {
    await client.post('/v1/admin/analytics/reset', {});
    void query.refetch();
  };

  return (
    <div className="analytics-screen">
      <header className="analytics-header">
        <div>
          <Typography.Text className="analytics-kicker">Observator trafic</Typography.Text>
          <Typography.Title level={2}>Analytics DentNow</Typography.Title>
          <Typography.Paragraph>Vizitatori, comportament, conținut și distribuție geografică într-o singură vedere.</Typography.Paragraph>
        </div>
        <Space className="analytics-controls" wrap>
          <Segmented options={[{ label: 'Azi', value: '1' }, { label: '7 zile', value: '7' }, { label: '30 zile', value: '30' }, { label: 'Personalizat', value: 'custom' }]} value={range.preset} onChange={setPreset} />
          {range.preset === 'custom' && (
            <RangePicker
              aria-label="Alege perioada analytics"
              value={[dayjs(range.from), dayjs(range.to)]}
              defaultOpen={!(searchParams.get('from') && searchParams.get('to'))}
              allowClear={false}
              disabledDate={(current) => current.isAfter(dayjs(), 'day')}
              onChange={(_dates, strings) => {
                if (strings[0] && strings[1]) setSearchParams({ range: 'custom', from: strings[0], to: strings[1] });
              }}
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>Actualizează</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => void exportCsv()} disabled={!query.data}>Export CSV</Button>
          <Popconfirm title="Ești sigur că vrei să ștergi TOATE datele de analytics?" onConfirm={() => void handleReset()} okText="Da, șterge" cancelText="Anulează">
            <Button danger icon={<DeleteOutlined />}>Resetează</Button>
          </Popconfirm>
        </Space>
      </header>

      {query.isLoading && <Card><Skeleton active paragraph={{ rows: 9 }} /></Card>}
      {query.isError && <Alert type="error" showIcon title="Datele analytics nu au putut fi încărcate" description={(query.error as Error).message} action={<Button onClick={() => void query.refetch()}>Reîncearcă</Button>} />}
      {query.data && (
        <>
          <div className="analytics-range-note">
            {range.from} — {range.to} · fus orar {query.data.range.timezone}
            {' · '}{numberFormatter.format(query.data.collection.full_events)} evenimente cu acord pentru locație precisă
            {' · '}{numberFormatter.format(query.data.collection.limited_events)} evenimente fără acord pentru locație precisă
          </div>
          {!query.data.collection.enabled && (
            <Alert
              className="analytics-collection-alert"
              type="warning"
              showIcon
              title="Colectarea analytics este dezactivată"
              description="Dashboardul rămâne disponibil pentru datele istorice. Setează ANALYTICS_ENABLED=true numai după aprobarea politicii de confidențialitate."
            />
          )}
          <section className="analytics-kpis" aria-label="Indicatori principali">
            <Card><Statistic title="Vizitatori" value={query.data.kpis.visitors} /><Delta value={query.data.kpis.deltas.visitors} /><small>{query.data.kpis.new_visitors} noi · {query.data.kpis.returning_visitors} recurenți</small></Card>
            <Card><Statistic title="Sesiuni" value={query.data.kpis.sessions} /><Delta value={query.data.kpis.deltas.sessions} /></Card>
            <Card><Statistic title="Vizualizări pagini" value={query.data.kpis.page_views} /><Delta value={query.data.kpis.deltas.page_views} /></Card>
            <Card><Statistic title="Interacțiuni contact" value={query.data.kpis.cta_clicks} /><Delta value={query.data.kpis.deltas.cta_clicks} /><small>Conversie {query.data.kpis.cta_conversion}%</small></Card>
          </section>

          <Card className="analytics-panel analytics-trend-card" title="Evoluția traficului">
            <TrafficTrendChart data={query.data.trend} />
          </Card>

          <section className="analytics-grid analytics-grid--three" aria-label="Profil tehnic al vizitatorilor">
            <Breakdown title="Dispozitive" items={query.data.devices} />
            <Breakdown title="Browsere" items={query.data.browsers} />
            <Breakdown title="Sisteme de operare" items={query.data.operating_systems} />
          </section>

          <GeographyCharts rows={query.data.geography} collection={query.data.collection} />

          <section id="analytics-content" className="analytics-grid analytics-grid--two" aria-label="Conținut și achiziție">
            <ContentTable title="Cele mai accesate pagini" items={query.data.top_pages} />
            <ContentTable title="Cele mai accesate secțiuni" items={query.data.top_sections} />
            <ContentTable title="Cele mai frecvente clickuri (navigare/linkuri)" items={query.data.top_clicks} />
            <ContentTable title="Cele mai citite articole" items={query.data.top_articles} />
            <ContentTable title="Tratamente populare" items={query.data.top_treatments} />
            <ContentTable title="Oferte populare" items={query.data.top_offers} />
            <ContentTable title="Surse de trafic" items={query.data.referrers} />
            <ContentTable title="Clickuri pe telefon, WhatsApp și e-mail" items={query.data.contact_ctas} />
            <ContentTable title="Furnizori de internet" items={query.data.internet_providers} />
            <ContentTable title="Fusuri orare" items={query.data.timezones} />
            <ContentTable title="Adrese IP active" items={query.data.ip_addresses} />
            <ContentTable title="User-Agent-uri" items={query.data.user_agents} />
          </section>
        </>
      )}
    </div>
  );
}
