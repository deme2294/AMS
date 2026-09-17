import React, { useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler, ChartOptions, ChartData
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

// ─────────────────────────────────────────────────────────────
// BASE CHART CONFIG & THEMING
// ─────────────────────────────────────────────────────────────
const commonOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1e293b',
      bodyColor: '#334155',
      padding: { x: 14, y: 10 },
      cornerRadius: 4,
      displayColors: true,
      usePointStyle: true,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      borderWidth: 1,
      titleFont: { family: "'Roboto', 'Inter', sans-serif", size: 13, weight: 'bold' },
      bodyFont: { family: "'Roboto', 'Inter', sans-serif", size: 12 }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
};

const commonScales = {
  x: {
    grid: { display: false, drawBorder: false },
    ticks: { font: { family: "'Roboto', 'Inter', sans-serif", size: 12 }, color: '#64748b' }
  },
  y: {
    grid: { color: 'rgba(148, 163, 184, 0.15)', drawBorder: false }, // Faint horizontal lines typical of MUI
    ticks: { font: { family: "'Roboto', 'Inter', sans-serif", size: 12 }, padding: 12, color: '#64748b' },
    border: { display: false }
  }
};

// ─────────────────────────────────────────────────────────────
// LINE CHART
// ─────────────────────────────────────────────────────────────
interface BaseChartProps {
  data: ChartData<any>;
  height?: number | string;
  hideGrid?: boolean;
}

export const LineChart: React.FC<BaseChartProps> = ({ data, height = 300, hideGrid }) => {
  const options: ChartOptions<'line'> = useMemo(() => ({
    ...commonOptions,
    scales: hideGrid ? { x: { display: false }, y: { display: false } } : commonScales,
    elements: {
      line: { tension: 0, borderWidth: 2 }, // MUI uses mostly straight lines
      point: { radius: 3, hitRadius: 10, hoverRadius: 5, borderWidth: 2, backgroundColor: '#fff' }
    }
  }), [hideGrid]);

  return <div style={{ height, width: '100%' }}><Line data={data} options={options} /></div>;
};

// ─────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────
export const BarChart: React.FC<BaseChartProps & { stacked?: boolean }> = ({ data, height = 300, stacked, hideGrid }) => {
  const options: ChartOptions<'bar'> = useMemo(() => {
    const s = hideGrid ? { x: { display: false }, y: { display: false } } : commonScales;
    return {
      ...commonOptions,
      scales: {
        x: { ...s.x, stacked },
        y: { ...s.y, stacked }
      },
      elements: {
        bar: { borderRadius: 2, borderSkipped: false } // MUI bars are usually squared off or very slightly rounded
      }
    };
  }, [stacked, hideGrid]);

  return <div style={{ height, width: '100%' }}><Bar data={data} options={options} /></div>;
};

// ─────────────────────────────────────────────────────────────
// PIE CHART
// ─────────────────────────────────────────────────────────────
export const PieChart: React.FC<BaseChartProps> = ({ data, height = 300 }) => {
  const options: ChartOptions<'pie'> = useMemo(() => ({
    ...commonOptions,
    elements: {
      arc: { borderWidth: 0, hoverOffset: 8 }
    }
  }), []);

  return <div style={{ height, width: '100%' }}><Pie data={data} options={options} /></div>;
};

// ─────────────────────────────────────────────────────────────
// DOUGHNUT CHART
// ─────────────────────────────────────────────────────────────
export const DoughnutChart: React.FC<BaseChartProps & { cutout?: string }> = ({ data, height = 300, cutout = '75%' }) => {
  const options: ChartOptions<'doughnut'> = useMemo(() => ({
    ...commonOptions,
    cutout,
    elements: {
      arc: { borderWidth: 0, hoverOffset: 8, borderRadius: 4 }
    }
  }), [cutout]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};
