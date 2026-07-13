import { useMemo } from 'react';
import { Card, Empty } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import * as echarts from 'echarts/core';
import { EffectScatterChart, LineChart, MapChart, ScatterChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { AnalyticsOverview } from './analyticsContracts';
import romaniaGeoJson from './maps/romania.geo.json';
import bucharestSectorsGeoJson from './maps/bucharest-sectors.geo.json';

const ROMANIA_MAP = 'dentnow-romania';
const BUCHAREST_MAP = 'dentnow-bucharest-sectors';
const CHART_THEME = 'dentnow-analytics';
const mapInput = (value: unknown) => value as Parameters<typeof echarts.registerMap>[1];

echarts.use([
  AriaComponent,
  DataZoomComponent,
  EffectScatterChart,
  GeoComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  MapChart,
  ScatterChart,
  SVGRenderer,
  TooltipComponent,
  VisualMapComponent,
]);

echarts.registerMap(ROMANIA_MAP, mapInput(romaniaGeoJson));
echarts.registerMap(BUCHAREST_MAP, mapInput(bucharestSectorsGeoJson));
echarts.registerTheme(CHART_THEME, {
  color: ['#0f7f8d', '#d99a43', '#4a8d79', '#315b66', '#9a6a42'],
  textStyle: { color: '#52656a', fontFamily: 'Inter, system-ui, sans-serif' },
  legend: {
    top: 0,
    icon: 'roundRect',
    itemWidth: 12,
    itemHeight: 7,
    textStyle: { color: '#52656a', fontSize: 12 },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#dfe8e9' } },
    axisTick: { show: false },
    axisLabel: { color: '#718085', fontSize: 11 },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#718085', fontSize: 11 },
    splitLine: { lineStyle: { color: '#e9efef', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8e9',
    borderWidth: 1,
    textStyle: { color: '#1e3035', fontSize: 12 },
  },
});

type GeographyRow = AnalyticsOverview['geography'][number];
type Position = [number, number];
type PolygonCoordinates = Position[][];
type MultiPolygonCoordinates = Position[][][];

interface MapFeature {
  properties: { name?: string; sector?: number };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
}

const ROMANIA_FEATURE = romaniaGeoJson.features[0] as unknown as MapFeature;
const BUCHAREST_FEATURES = bucharestSectorsGeoJson.features as unknown as MapFeature[];

function pointInRing([x, y]: Position, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] ?? [0, 0];
    const [xj, yj] = ring[j] ?? [0, 0];
    const crosses = ((yi > y) !== (yj > y))
      && x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: Position, polygon: PolygonCoordinates): boolean {
  const [outer, ...holes] = polygon;
  return Boolean(outer && pointInRing(point, outer) && !holes.some((hole) => pointInRing(point, hole)));
}

function featureContains(feature: MapFeature, point: Position): boolean {
  if (feature.geometry.type === 'Polygon') {
    return pointInPolygon(point, feature.geometry.coordinates as PolygonCoordinates);
  }
  return (feature.geometry.coordinates as MultiPolygonCoordinates)
    .some((polygon) => pointInPolygon(point, polygon));
}

function chartPoint(row: GeographyRow): Position | null {
  return row.longitude === null || row.latitude === null ? null : [row.longitude, row.latitude];
}

function locationName(row: GeographyRow): string {
  return [row.city, row.region, row.country]
    .filter((part, index, values) => part !== 'Necunoscut' && values.indexOf(part) === index)
    .join(', ') || 'Locație necunoscută';
}

function formatterParams(raw: unknown): {
  name?: string;
  value?: number | Array<string | number>;
  data?: { views?: number; sector?: string };
} {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return candidate && typeof candidate === 'object' ? candidate as ReturnType<typeof formatterParams> : {};
}

export function TrafficTrendChart({ data }: { data: AnalyticsOverview['trend'] }) {
  const option = useMemo<EChartsOption>(() => ({
    aria: {
      enabled: true,
      decal: { show: true },
      description: `Evoluția traficului pentru ${data.length} zile: vizualizări, vizitatori și sesiuni.`,
    },
    animationDuration: 550,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis',
      renderMode: 'richText',
      axisPointer: { type: 'cross', label: { backgroundColor: '#315b66' } },
    },
    legend: { data: ['Vizualizări pagini', 'Vizitatori', 'Sesiuni'] },
    grid: { left: 18, right: 20, top: 46, bottom: data.length > 31 ? 58 : 28, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisLabel: {
        formatter: (value: string) => new Intl.DateTimeFormat('ro-RO', {
          day: '2-digit', month: 'short',
        }).format(new Date(`${value}T12:00:00`)),
      },
    },
    yAxis: { type: 'value', minInterval: 1 },
    dataZoom: data.length > 31 ? [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 18, bottom: 4, borderColor: '#dfe8e9', fillerColor: 'rgba(15,127,141,.12)' },
    ] : [],
    series: [
      {
        name: 'Vizualizări pagini',
        type: 'line',
        smooth: 0.28,
        showSymbol: data.length <= 14,
        symbolSize: 6,
        lineStyle: { width: 3, color: '#0f7f8d' },
        itemStyle: { color: '#0f7f8d' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(15,127,141,.30)' },
            { offset: 1, color: 'rgba(15,127,141,.02)' },
          ]),
        },
        data: data.map((item) => item.page_views),
      },
      {
        name: 'Vizitatori',
        type: 'line',
        smooth: 0.28,
        showSymbol: data.length <= 14,
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#d99a43' },
        itemStyle: { color: '#d99a43' },
        data: data.map((item) => item.visitors),
      },
      {
        name: 'Sesiuni',
        type: 'line',
        smooth: 0.28,
        showSymbol: false,
        lineStyle: { width: 2, type: 'dashed', color: '#4a8d79' },
        itemStyle: { color: '#4a8d79' },
        data: data.map((item) => item.sessions),
      },
    ],
  }), [data]);

  return (
    <>
      <div className="analytics-echart" role="img" aria-label={`Evoluție trafic în ${data.length} zile, redată cu Apache ECharts`}>
        <ReactEChartsCore echarts={echarts} option={option} theme={CHART_THEME} notMerge lazyUpdate opts={{ renderer: 'svg' }} style={{ height: 330 }} />
      </div>
      <table className="analytics-sr-only">
        <caption>Datele graficului de trafic</caption>
        <thead><tr><th>Data</th><th>Vizitatori</th><th>Sesiuni</th><th>Vizualizări</th></tr></thead>
        <tbody>{data.map((item) => <tr key={item.date}><td>{item.date}</td><td>{item.visitors}</td><td>{item.sessions}</td><td>{item.page_views}</td></tr>)}</tbody>
      </table>
    </>
  );
}

function RomaniaChart({ rows }: { rows: GeographyRow[] }) {
  const points = useMemo(() => rows.flatMap((row) => {
    const point = chartPoint(row);
    return point && featureContains(ROMANIA_FEATURE, point) ? [{
      name: locationName(row),
      value: [point[0], point[1], row.visitors, row.views],
    }] : [];
  }), [rows]);
  const maximum = useMemo(
    () => Math.max(1, ...points.map((point) => Number(point.value[2]))),
    [points],
  );
  const option = useMemo<EChartsOption>(() => ({
    aria: { enabled: true, description: `Distribuția vizitatorilor în România, ${points.length} zone geolocalizate.` },
    tooltip: {
      trigger: 'item',
      renderMode: 'richText',
      formatter: (raw: unknown) => {
        const params = formatterParams(raw);
        const value = Array.isArray(params.value) ? params.value : [];
        return `${params.name ?? 'Locație'}\n${value[2] ?? 0} vizitatori · ${value[3] ?? 0} vizualizări`;
      },
    },
    visualMap: {
      type: 'continuous', min: 0, max: maximum, dimension: 2,
      left: 10, bottom: 8, text: ['Mai mulți', 'Mai puțini'],
      calculable: false, inRange: { color: ['#9dd7d2', '#0f7f8d', '#d99a43'] },
    },
    geo: {
      map: ROMANIA_MAP,
      roam: true,
      scaleLimit: { min: 1, max: 8 },
      layoutCenter: ['52%', '48%'],
      layoutSize: '94%',
      itemStyle: { areaColor: '#edf6f3', borderColor: '#8ab7ac', borderWidth: 1.2 },
      emphasis: { itemStyle: { areaColor: '#dceee8' }, label: { show: false } },
      select: { disabled: true },
    },
    series: [{
      name: 'Vizitatori',
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: points,
      symbolSize: (value: number[]) => Math.min(28, 7 + Math.sqrt(Number(value[2] ?? 0)) * 2),
      rippleEffect: { scale: 2.2, brushType: 'stroke' },
      itemStyle: { color: '#d58a35', shadowBlur: 10, shadowColor: 'rgba(118,75,25,.28)' },
      emphasis: { scale: 1.25 },
    }],
  }), [maximum, points]);

  if (points.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nu există coordonate din România în această perioadă" />;
  }
  return (
    <div className="analytics-echart analytics-echart--map" role="img" aria-label={`Hartă România cu ${points.length} zone de trafic`}>
      <ReactEChartsCore echarts={echarts} option={option} theme={CHART_THEME} notMerge lazyUpdate opts={{ renderer: 'svg' }} style={{ height: 390 }} />
    </div>
  );
}

function BucharestSectorsChart({ rows }: { rows: GeographyRow[] }) {
  const geography = useMemo(() => {
    const totals = new Map(BUCHAREST_FEATURES.map((feature) => [
      feature.properties.name ?? '',
      { visitors: 0, views: 0 },
    ]));
    const points = rows.flatMap((row) => {
      const point = chartPoint(row);
      if (!point) return [];
      const feature = BUCHAREST_FEATURES.find((candidate) => featureContains(candidate, point));
      const name = feature?.properties.name;
      if (!name) return [];
      const total = totals.get(name);
      if (total) {
        total.visitors += row.visitors;
        total.views += row.views;
      }
      return [{ name: locationName(row), sector: name, value: [point[0], point[1], row.visitors, row.views] }];
    });
    const sectorData = [...totals.entries()].map(([name, value]) => ({
      name,
      value: value.visitors,
      views: value.views,
    }));
    return {
      points,
      sectorData,
      maximum: Math.max(1, ...sectorData.map((sector) => sector.value)),
    };
  }, [rows]);
  const { points, sectorData, maximum } = geography;
  const option = useMemo<EChartsOption>(() => ({
    aria: { enabled: true, description: `Distribuția vizitatorilor în cele șase sectoare ale Bucureștiului.` },
    tooltip: {
      trigger: 'item',
      renderMode: 'richText',
      formatter: (raw: unknown) => {
        const params = formatterParams(raw);
        if (Array.isArray(params.value)) {
          return `${params.data?.sector ?? params.name}\n${params.value[2] ?? 0} vizitatori · ${params.value[3] ?? 0} vizualizări`;
        }
        return `${params.name ?? 'Sector'}\n${params.value ?? 0} vizitatori · ${params.data?.views ?? 0} vizualizări`;
      },
    },
    visualMap: {
      type: 'continuous', min: 0, max: maximum,
      left: 8, bottom: 8, text: ['Mai mulți', 'Mai puțini'],
      inRange: { color: ['#eef8f5', '#79c4bb', '#0f7f8d'] },
      calculable: false,
    },
    series: [
      {
        name: 'Vizitatori pe sector',
        type: 'map',
        map: BUCHAREST_MAP,
        roam: false,
        layoutCenter: ['53%', '48%'],
        layoutSize: '94%',
        data: sectorData,
        label: {
          show: true,
          color: '#29434a',
          fontSize: 11,
          fontWeight: 700,
          formatter: (raw: unknown) => {
            const params = formatterParams(raw);
            return `${params.name ?? ''}\n${params.value ?? 0}`;
          },
        },
        itemStyle: { areaColor: '#eef8f5', borderColor: '#ffffff', borderWidth: 2 },
        emphasis: { label: { color: '#17383f' }, itemStyle: { areaColor: '#d99a43' } },
        select: { disabled: true },
      },
      {
        name: 'Zone geolocalizate',
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: points,
        symbolSize: (value: number[]) => Math.min(19, 5 + Math.sqrt(Number(value[2] ?? 0)) * 1.5),
        itemStyle: { color: '#d58a35', borderColor: '#ffffff', borderWidth: 1.5 },
      },
    ],
    // A hidden geo coordinate system aligns the scatter with the registered sector map.
    geo: {
      map: BUCHAREST_MAP,
      roam: false,
      silent: true,
      layoutCenter: ['53%', '48%'],
      layoutSize: '94%',
      itemStyle: { opacity: 0 },
      emphasis: { disabled: true },
    },
  }), [maximum, points, sectorData]);

  if (points.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nu există coordonate din București în această perioadă" />;
  }
  return (
    <div className="analytics-echart analytics-echart--map" role="img" aria-label="Hartă București cu distribuția pe șase sectoare">
      <ReactEChartsCore echarts={echarts} option={option} theme={CHART_THEME} notMerge lazyUpdate opts={{ renderer: 'svg' }} style={{ height: 390 }} />
    </div>
  );
}

export function GeographyCharts({ rows }: { rows: AnalyticsOverview['geography'] }) {
  return (
    <section className="analytics-map-grid" aria-label="Distribuție geografică">
      <Card
        className="analytics-panel analytics-map-card"
        title={<span><EnvironmentOutlined /> România · distribuție națională</span>}
        extra={<span className="analytics-card-meta">zoom & panoramare</span>}
      >
        <RomaniaChart rows={rows} />
        <p className="analytics-map-attribution">Hartă © OpenStreetMap contributors · ODbL 1.0</p>
      </Card>
      <Card
        className="analytics-panel analytics-map-card"
        title={<span><EnvironmentOutlined /> București · distribuție pe sectoare</span>}
        extra={<span className="analytics-card-meta">Sectoarele 1–6</span>}
      >
        <BucharestSectorsChart rows={rows} />
        <p className="analytics-map-attribution">Limite administrative © OpenStreetMap contributors · ODbL 1.0</p>
      </Card>
    </section>
  );
}
