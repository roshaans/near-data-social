import cubejs from '@cubejs-client/core';
import { QueryRenderer } from '@cubejs-client/react';
import { Spin } from 'antd';
import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useDeepCompareMemo } from 'use-deep-compare';
import { Table } from 'antd';
import 'chart.js/auto';
const COLORS_SERIES = [
  '#5b8ff9',
  '#5ad8a6',
  '#5e7092',
  '#f6bd18',
  '#6f5efa',
  '#6ec8ec',
  '#945fb9',
  '#ff9845',
  '#299796',
  '#fe99c3',
];
const PALE_COLORS_SERIES = [
  '#d7e3fd',
  '#daf5e9',
  '#d6dbe4',
  '#fdeecd',
  '#dad8fe',
  '#dbf1fa',
  '#e4d7ed',
  '#ffe5d2',
  '#cce5e4',
  '#ffe6f0',
];
const commonOptions = {
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: true,
        maxRotation: 0,
        padding: 12,
        minRotation: 0,
      },
    },
  },
};

const useDrilldownCallback = ({
  datasets,
  labels,
  onDrilldownRequested,
  pivotConfig,
}) => {
  return React.useCallback(
    (elements) => {
      if (elements.length <= 0) return;
      const { datasetIndex, index } = elements[0];
      const { yValues } = datasets[datasetIndex];
      const xValues = [labels[index]];

      if (typeof onDrilldownRequested === 'function') {
        onDrilldownRequested(
          {
            xValues,
            yValues,
          },
          pivotConfig
        );
      }
    },
    [datasets, labels, onDrilldownRequested]
  );
};

const LineChartRenderer = ({
  resultSet,
  pivotConfig,
  onDrilldownRequested
}) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        borderColor: COLORS_SERIES[index],
        pointRadius: 1,
        tension: 0.1,
        pointHoverRadius: 1,
        borderWidth: 2,
        tickWidth: 1,
        fill: false,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets,
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Line
      type="line"
      data={data}
      options={commonOptions}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

export const BarChartRenderer = ({ resultSet, pivotConfig, onDrilldownRequested }) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        backgroundColor: COLORS_SERIES[index],
        fill: false,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets,
  };
  const stacked = !(pivotConfig.x || []).includes('measures');
  const options = {
    ...commonOptions,
    scales: {
      x: { ...commonOptions.scales.x, stacked },
      y: { ...commonOptions.scales.y, stacked },
    },
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    onDrilldownRequested,
    pivotConfig,
  });
  return (
    <Bar
      type="bar"
      data={data}
      options={options}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

export const AreaChartRenderer = ({
  resultSet,
  pivotConfig,
  onDrilldownRequested,
}) => {
  const datasets = useDeepCompareMemo(
    () =>
      resultSet.series(pivotConfig).map((s, index) => ({
        label: s.title,
        data: s.series.map((r) => r.value),
        yValues: [s.key],
        pointRadius: 1,
        pointHoverRadius: 1,
        backgroundColor: PALE_COLORS_SERIES[index],
        borderWidth: 0,
        fill: true,
        tension: 0,
      })),
    [resultSet, pivotConfig]
  );
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets,
  };
  const options = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        stacked: true,
      },
    },
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Line
      type="area"
      data={data}
      options={options}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

export const PieChartRenderer = ({ resultSet, pivotConfig, onDrilldownRequested }) => {
  const data = {
    labels: resultSet.categories(pivotConfig).map((c) => c.x),
    datasets: resultSet.series(pivotConfig).map((s) => ({
      label: s.title,
      data: s.series.map((r) => r.value),
      yValues: [s.key],
      backgroundColor: COLORS_SERIES,
      hoverBackgroundColor: COLORS_SERIES,
    })),
  };
  const getElementAtEvent = useDrilldownCallback({
    datasets: data.datasets,
    labels: data.labels,
    pivotConfig,
    onDrilldownRequested,
  });
  return (
    <Pie
      type="pie"
      data={data}
      options={commonOptions}
      getElementAtEvent={getElementAtEvent}
    />
  );
};

const formatTableData = (columns, data) => {
  function flatten(columns = []) {
    return columns.reduce((memo, column) => {
      if (column.children) {
        return [...memo, ...flatten(column.children)];
      }

      return [...memo, column];
    }, []);
  }

  const typeByIndex = flatten(columns).reduce((memo, column) => {
    return { ...memo, [column.dataIndex]: column };
  }, {});

  function formatValue(value, { type, format } = {}) {
    if (value == undefined) {
      return value;
    }

    if (type === 'boolean') {
      if (typeof value === 'boolean') {
        return value.toString();
      } else if (typeof value === 'number') {
        return Boolean(value).toString();
      }

      return value;
    }

    if (type === 'number' && format === 'percent') {
      return [parseFloat(value).toFixed(2), '%'].join('');
    }

    return value.toString();
  }

  function format(row) {
    return Object.fromEntries(
      Object.entries(row).map(([dataIndex, value]) => {
        return [dataIndex, formatValue(value, typeByIndex[dataIndex])];
      })
    );
  }

  return data.map(format);
};

export const TableRenderer = ({ resultSet, pivotConfig }) => {
  const [tableColumns, dataSource] = useDeepCompareMemo(() => {
    const columns = resultSet.tableColumns(pivotConfig);
    return [
      columns,
      formatTableData(columns, resultSet.tablePivot(pivotConfig)),
    ];
  }, [resultSet, pivotConfig]);
  return (
    <Table pagination={false} columns={tableColumns} dataSource={dataSource} />
  );
};


const cubejsApi = cubejs(
  process.env.NEXT_PUBLIC_CUBEJS_TOKEN
  , { apiUrl: process.env.NEXT_PUBLIC_CUBEJS_API_URL }
);
const renderChart = ({ resultSet, error, pivotConfig, onDrilldownRequested, type }) => {

  if (error) {
    return <div>{error.toString()}</div>;
  }

  if (!resultSet) {
    return <Spin />;
  }
  switch (type) {
    case 'line': return (<LineChartRenderer
      resultSet={resultSet}
      pivotConfig={pivotConfig}
      onDrilldownRequested={onDrilldownRequested}
    />)
    case 'pie': return (<PieChartRenderer resultSet={resultSet}
      pivotConfig={pivotConfig}
      onDrilldownRequested={onDrilldownRequested} />)
    case 'table': return (<TableRenderer resultSet={resultSet}
      pivotConfig={pivotConfig}
      onDrilldownRequested={onDrilldownRequested} />)
    case 'area': return (<AreaChartRenderer resultSet={resultSet}
      pivotConfig={pivotConfig}
      onDrilldownRequested={onDrilldownRequested} />)
    default: return (<LineChartRenderer
      resultSet={resultSet}
      pivotConfig={pivotConfig}
      onDrilldownRequested={onDrilldownRequested}
    />)
  }

};

const ChartRenderer = (type) => {
  return (
    <QueryRenderer
      query={{
        "measures": [
          "Transactions.count"
        ],
        "timeDimensions": [
          {
            "dimension": "Transactions.blockTimestamp",
            "granularity": "day"
          }
        ],
        "order": {
          "Transactions.blockTimestamp": "asc"
        }
      }}
      cubejsApi={cubejsApi}
      resetResultSetOnChange={false}
      render={(props) => renderChart({
        ...props,
        chartType: type,
        pivotConfig: {
          "x": [
            "Transactions.blockTimestamp.day"
          ],
          "y": [
            "measures"
          ],
          "fillMissingDates": true,
          "joinDateRange": false
        },
        type: type
      })}
    />
  );
};


export default ChartRenderer;
