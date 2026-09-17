// src/components/demo components/linechart.tsx
// NOTE: Filename is linechart.tsx, but HTML context suggests a Bar Chart. Implementing as Bar Chart.
// Consider renaming this file to BarChart.tsx or similar.

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, // x-axis
  LinearScale,   // y-axis
  BarElement,    // The bars themselves
  Title,         // Chart title
  Tooltip,       // Tooltip on hover
  Legend,        // Legend (labels for datasets)
} from 'chart.js';
import { Bar } from 'react-chartjs-2'; // Import the Bar component

// Register the components Chart.js needs to draw a bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Sample Chart Options ---
// Replace with options based on your original chart-bar.js or theme.js logic
export const options = {
  responsive: true, // Make the chart responsive
  maintainAspectRatio: false, // Allow custom aspect ratio via container size
  plugins: {
    legend: {
      position: 'top' as const, // Position the legend at the top
    },
    title: {
      display: true,
      text: 'Sample Bar Chart', // Add a title
    },
    tooltip: {
        mode: 'index' as const, // Show tooltips for all datasets at that index
        intersect: false,       // Tooltip triggers even if not directly hovering over the bar
    }
  },
  scales: {
    x: {
      stacked: false, // Set to true for stacked bars
      grid: {
        display: false, // Hide x-axis grid lines for cleaner look
      }
    },
    y: {
      stacked: false, // Set to true for stacked bars
      beginAtZero: true, // Start y-axis at 0
      // Add other y-axis configurations if needed (e.g., ticks formatting)
    },
  },
};

// --- Sample Chart Data ---
// Replace with data based on your original chart-bar.js or theme.js logic
const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data = {
  labels,
  datasets: [
    {
      label: 'Dataset 1',
      data: labels.map(() => Math.floor(Math.random() * 1000)), // Sample data
      backgroundColor: 'rgba(54, 162, 235, 0.5)', // Blue bars with transparency
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
    {
      label: 'Dataset 2',
      data: labels.map(() => Math.floor(Math.random() * 1000)), // Sample data
      backgroundColor: 'rgba(255, 99, 132, 0.5)', // Red bars with transparency
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1,
    },
  ],
};

// Component name matches filename, despite being a Bar chart based on context
const LineChart: React.FC = () => {
  return (
    // Container div helps control the chart's size and aspect ratio.
    // Chart.js will adapt to this container if 'responsive' is true and 'maintainAspectRatio' is false.
    // Adjust height as needed. The 'max-w-100' class isn't directly needed on the canvas anymore.
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
        {/* Render the Bar component from react-chartjs-2 */}
        {/* Pass the defined options and data as props */}
        <Bar options={options} data={data} />
    </div>
  );
};

// Exporting component named after the file
export default LineChart;