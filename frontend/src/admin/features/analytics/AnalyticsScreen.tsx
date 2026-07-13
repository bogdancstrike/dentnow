import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import type { AdminClient } from '../../api/adminClient';
import {
  AnalyticsOverviewSchema,
  type AnalyticsDimension,
  type AnalyticsOverview,
} from './analyticsContracts';
import './AnalyticsScreen.css';

const { RangePicker } = DatePicker;
const dateFormatter = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' });
const numberFormatter = new Intl.NumberFormat('ro-RO');

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateRange(params: URLSearchParams): { from: string; to: string; preset: string } {
  const preset = params.get('range') ?? '30';
  const to = new Date();
  if (preset === 'custom' && params.get('from') && params.get('to')) {
    return { from: params.get('from')!, to: params.get('to')!, preset };
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

function TrendChart({ data }: { data: AnalyticsOverview['trend'] }) {
  const width = 820;
  const height = 250;
  const pad = 34;
  const max = Math.max(1, ...data.flatMap((item) => [item.page_views, item.visitors]));
  const x = (index: number) => pad + (data.length <= 1 ? 0 : index * (width - pad * 2) / (data.length - 1));
  const y = (value: number) => height - pad - value * (height - pad * 2) / max;
  const points = (key: 'page_views' | 'visitors') => data.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');
  const aria = `Evoluție în ${data.length} zile. Maximum ${max} evenimente pe zi.`;
  return (
    <div className="analytics-trend">
      <div className="analytics-chart-legend" aria-hidden="true">
        <span><i className="analytics-dot analytics-dot--views" />Vizualizări pagini</span>
        <span><i className="analytics-dot analytics-dot--visitors" />Vizitatori</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={aria} className="analytics-trend-svg">
        {[0, .25, .5, .75, 1].map((ratio) => (
          <g key={ratio}>
            <line x1={pad} y1={y(max * ratio)} x2={width - pad} y2={y(max * ratio)} className="analytics-grid-line" />
            <text x={pad - 8} y={y(max * ratio) + 4} textAnchor="end" className="analytics-axis-text">{Math.round(max * ratio)}</text>
          </g>
        ))}
        <polyline points={points('page_views')} className="analytics-line analytics-line--views" />
        <polyline points={points('visitors')} className="analytics-line analytics-line--visitors" />
        {data.map((item, index) => (
          <g key={item.date}>
            <circle cx={x(index)} cy={y(item.visitors)} r="3" className="analytics-point analytics-point--visitors"><title>{`${item.date}: ${item.visitors} vizitatori`}</title></circle>
            {(index === 0 || index === data.length - 1 || (data.length <= 14 && index % 2 === 0)) && (
              <text x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} className="analytics-axis-text">
                {dateFormatter.format(new Date(`${item.date}T12:00:00`))}
              </text>
            )}
          </g>
        ))}
      </svg>
      <table className="analytics-sr-only">
        <caption>Datele graficului de trafic</caption>
        <thead><tr><th>Data</th><th>Vizitatori</th><th>Vizualizări</th></tr></thead>
        <tbody>{data.map((item) => <tr key={item.date}><td>{item.date}</td><td>{item.visitors}</td><td>{item.page_views}</td></tr>)}</tbody>
      </table>
    </div>
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

function GeoMap({ rows }: { rows: AnalyticsOverview['geography'] }) {
  const points = rows.filter((row) => row.latitude !== null && row.longitude !== null);
  return (
    <Card className="analytics-panel analytics-geo" title={<span><EnvironmentOutlined /> Distribuție geografică</span>}>
      {rows.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Locația nu este disponibilă pentru această perioadă" /> : (
        <div className="analytics-geo-layout">
          <svg viewBox="0 0 900 430" role="img" aria-label={`Hartă cu ${points.length} zone geolocalizate`} className="analytics-world-map">
            <rect x="0" y="0" width="900" height="430" rx="20" className="analytics-map-water" />
            <path d="M90 85l80-42 118 28 36 48-43 35-15 60-57 37-66-28-25-48-54-35zM260 254l58 16 31 60-28 79-43-28-19-69zM430 77l76-30 70 21 31 52 85 6 74 47-25 59-87-5-53 29-36-39-53 8-33-59-63-22zM594 278l61-20 72 34 16 58-48 35-77-27z" className="analytics-map-land" />
            {points.map((row, index) => {
              const cx = ((row.longitude! + 180) / 360) * 900;
              const cy = ((90 - row.latitude!) / 180) * 430;
              const radius = Math.min(18, 5 + Math.sqrt(row.visitors));
              return <circle key={`${row.country}-${row.region}-${row.city}-${index}`} cx={cx} cy={cy} r={radius} className="analytics-map-point"><title>{`${row.city}, ${row.region}, ${row.country}: ${row.visitors} vizitatori`}</title></circle>;
            })}
          </svg>
          <div className="analytics-geo-list">
            {rows.slice(0, 8).map((row, index) => (
              <div key={`${row.country}-${row.region}-${row.city}-${index}`}>
                <span>{[row.city, row.region, row.country].filter((part) => part !== 'Necunoscut').join(', ') || 'Necunoscut'}</span>
                <strong>{numberFormatter.format(row.visitors)}</strong>
              </div>
            ))}
          </div>
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
      <Table rowKey="key" columns={dimensionColumns} dataSource={items} pagination={{ pageSize: 8, hideOnSinglePage: true }} size="small" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nu există activitate" /> }} />
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

  return (
    <div className="analytics-screen">
      <header className="analytics-header">
        <div>
          <Typography.Text className="analytics-kicker">Observator trafic</Typography.Text>
          <Typography.Title level={2}>Analytics DentNow</Typography.Title>
          <Typography.Paragraph>Vizitatori, comportament, conținut și distribuție geografică într-o singură vedere.</Typography.Paragraph>
        </div>
        <Space wrap>
          <Segmented options={[{ label: 'Azi', value: '1' }, { label: '7 zile', value: '7' }, { label: '30 zile', value: '30' }, { label: 'Personalizat', value: 'custom' }]} value={range.preset} onChange={setPreset} />
          {range.preset === 'custom' && (
            <RangePicker aria-label="Alege perioada analytics" onChange={(_dates, strings) => {
              if (strings[0] && strings[1]) setSearchParams({ range: 'custom', from: strings[0], to: strings[1] });
            }} />
          )}
          <Button icon={<ReloadOutlined />} onClick={() => void query.refetch()} loading={query.isFetching}>Actualizează</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => void exportCsv()} disabled={!query.data}>Export CSV</Button>
        </Space>
      </header>

      {query.isLoading && <Card><Skeleton active paragraph={{ rows: 9 }} /></Card>}
      {query.isError && <Alert type="error" showIcon title="Datele analytics nu au putut fi încărcate" description={(query.error as Error).message} action={<Button onClick={() => void query.refetch()}>Reîncearcă</Button>} />}
      {query.data && (
        <>
          <div className="analytics-range-note">{range.from} — {range.to} · fus orar {query.data.range.timezone}</div>
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
            <TrendChart data={query.data.trend} />
          </Card>

          <section className="analytics-grid analytics-grid--three" aria-label="Profil tehnic al vizitatorilor">
            <Breakdown title="Dispozitive" items={query.data.devices} />
            <Breakdown title="Browsere" items={query.data.browsers} />
            <Breakdown title="Sisteme de operare" items={query.data.operating_systems} />
          </section>

          <GeoMap rows={query.data.geography} />

          <section id="analytics-content" className="analytics-grid analytics-grid--two" aria-label="Conținut și achiziție">
            <ContentTable title="Cele mai accesate pagini" items={query.data.top_pages} />
            <ContentTable title="Cele mai citite articole" items={query.data.top_articles} />
            <ContentTable title="Tratamente populare" items={query.data.top_treatments} />
            <ContentTable title="Oferte populare" items={query.data.top_offers} />
            <ContentTable title="Surse de trafic" items={query.data.referrers} />
            <ContentTable title="CTA de contact" items={query.data.contact_ctas} />
            <ContentTable title="Adrese IP active" items={query.data.ip_addresses} />
            <ContentTable title="User-Agent-uri" items={query.data.user_agents} />
          </section>
        </>
      )}
    </div>
  );
}
