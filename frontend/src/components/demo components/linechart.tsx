// src/components/demo components/linechart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, // x-axis
  LinearScale,   // y-axis
  PointElement,  // Data points
  LineElement,   // The line itself
  Title,         // Chart title
  Tooltip,       // Tooltip on hover
  Legend,        // Legend (labels for datasets)
  Filler,        // Needed for filling area under the line (backgroundColor)
} from 'chart.js';
import { Line } from 'react-chartjs-2'; // Import the Line component

// Register the components Chart.js needs to draw a line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler if using 'fill: true' and 'backgroundColor'
);

// --- Sample Chart Options ---
// TODO: Replace with options based on your original chart-line.js or theme.js logic
export const options = {
  responsive: true, // Make the chart responsive
  maintainAspectRatio: false, // Allow container CSS to control aspect ratio
  plugins: {
    legend: {
      position: 'top' as const, // Position the legend at the top
    },
    title: {
      display: true,
      text: 'Sample Line Chart', // Add a title
    },
    tooltip: {
        mode: 'index' as const, // Show tooltips for all datasets at that index
        intersect: false,       // Tooltip triggers even if not directly hovering over the point
    }
  },
  interaction: { // Often used with tooltips for better hover behavior
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      grid: {
        display: false, // Hide x-axis grid lines for cleaner look
      }
    },
    y: {
      beginAtZero: true, // Start y-axis at 0 (optional, depends on data)
      // Add other y-axis configurations if needed (e.g., ticks formatting)
    },
  },
};

// --- Sample Chart Data ---
// TODO: Replace with data based on your original chart-line.js or theme.js logic
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const data = {
  labels,
  datasets: [
    {
      fill: true, // Fill the area under the line
      label: 'Sales 2024',
      data: labels.map(() => Math.floor(Math.random() * 1000 + 50)), // Sample data
      borderColor: 'rgb(54, 162, 235)', // Line color
      backgroundColor: 'rgba(54, 162, 235, 0.2)', // Fill color (semi-transparent)
      tension: 0.1, // Makes the line slightly curved (0 for straight lines)
    },
    // Add more datasets if your original chart had multiple lines
    // {
    //   fill: false, // Example of a line without fill
    //   label: 'Sales 2023',
    //   data: labels.map(() => Math.floor(Math.random() * 800 + 40)), // Sample data
    //   borderColor: 'rgb(255, 99, 132)',
    //   tension: 0.1,
    // },
  ],
};


const LineChart: React.FC = () => {
  return (
    // Container div helps control the chart's size and aspect ratio.
    // Chart.js will adapt to this container if 'responsive' is true and 'maintainAspectRatio' is false.
    // Adjust height as needed. The 'max-w-100' class isn't directly needed on the canvas anymore.
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
        {/* Render the Line component from react-chartjs-2 */}
        {/* Pass the defined options and data as props */}
        <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;