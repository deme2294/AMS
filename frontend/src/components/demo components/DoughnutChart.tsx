// src/components/demo components/DoughnutChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement, // Needed for Doughnut/Pie charts
  Tooltip,    // Tooltip on hover
  Legend,     // Legend (labels for datasets)
  Title,      // Chart title
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2'; // Import the Doughnut component

// Register the components Chart.js needs to draw a doughnut chart
ChartJS.register(
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// --- Sample Chart Options ---
// TODO: Replace with options based on your original chart-doughnut.js or theme.js logic
export const options = {
  responsive: true, // Make the chart responsive
  maintainAspectRatio: false, // Allow container CSS to control aspect ratio
  plugins: {
    legend: {
      position: 'top' as const, // Position the legend at the top
    },
    title: {
      display: true,
      text: 'Sample Doughnut Chart', // Add a title
    },
    tooltip: {
        // Configure tooltips as needed
    }
  },
  // Cutout percentage can be adjusted here if needed (default is 50% for Doughnut)
  // cutout: '70%',
};

// --- Sample Chart Data ---
// TODO: Replace with data based on your original chart-doughnut.js or theme.js logic
const labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple'];

export const data = {
  labels,
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2], // Sample data points
      backgroundColor: [ // Provide a color for each data point
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ],
      borderColor: [ // Border color for each segment
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    },
  ],
};


const DoughnutChart: React.FC = () => {
  return (
    // Container div helps control the chart's size and aspect ratio.
    // Chart.js will adapt to this container if 'responsive' is true and 'maintainAspectRatio' is false.
    // Adjust height/width as needed. The 'max-w-100' class can be applied here if desired.
    // The original width="350" is ignored in favor of responsiveness or container styling.
    <div className="max-w-100" style={{ position: 'relative', height: '350px', width: '350px', margin: 'auto' }}> {/* Example fixed size or use % */}
        {/* Render the Doughnut component from react-chartjs-2 */}
        {/* Pass the defined options and data as props */}
        <Doughnut options={options} data={data} />
    </div>
  );
};

export default DoughnutChart;