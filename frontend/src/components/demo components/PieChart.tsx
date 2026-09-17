// src/components/demo components/PieChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement, // Needed for Doughnut/Pie charts
  Tooltip,    // Tooltip on hover
  Legend,     // Legend (labels for datasets)
  Title,      // Chart title
} from 'chart.js';
import { Pie } from 'react-chartjs-2'; // Import the Pie component

// Register the components Chart.js needs to draw a pie chart
ChartJS.register(
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// --- Sample Chart Options ---
// TODO: Replace with options based on your original chart-pie.js or theme.js logic
export const options = {
  responsive: true, // Make the chart responsive
  maintainAspectRatio: false, // Allow container CSS to control aspect ratio
  plugins: {
    legend: {
      position: 'top' as const, // Position the legend at the top
    },
    title: {
      display: true,
      text: 'Sample Pie Chart', // Add a title
    },
    tooltip: {
        // Configure tooltips as needed
    }
  },
};

// --- Sample Chart Data ---
// TODO: Replace with data based on your original chart-pie.js or theme.js logic
const labels = ['Category A', 'Category B', 'Category C', 'Category D'];

export const data = {
  labels,
  datasets: [
    {
      label: 'Distribution', // Label for the dataset
      data: [300, 50, 100, 80], // Sample data points
      backgroundColor: [ // Provide a color for each data point/slice
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      borderColor: [ // Border color for each slice
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};


const PieChart: React.FC = () => {
  return (
    // Container div helps control the chart's size and aspect ratio.
    // Chart.js will adapt to this container if 'responsive' is true and 'maintainAspectRatio' is false.
    // Adjust height/width as needed. The 'max-w-100' class can be applied here if desired.
    // The original width="350" is ignored in favor of responsiveness or container styling.
    <div className="max-w-100" style={{ position: 'relative', height: '350px', width: '350px', margin: 'auto' }}> {/* Example fixed size or use % */}
        {/* Render the Pie component from react-chartjs-2 */}
        {/* Pass the defined options and data as props */}
        <Pie options={options} data={data} />
    </div>
  );
};

export default PieChart;