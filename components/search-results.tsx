import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Bar, Line, Scatter } from "react-chartjs-2"; // Example using Chart.js
import * as XLSX from "xlsx"; // Import xlsx library for parsing XLSX files
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";

// Register the necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

interface SearchResultsComponentProps {
  datasets: string[];
}

export function SearchResultsComponent({
  datasets,
}: SearchResultsComponentProps) {
  const [datasetDetails, setDatasetDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisualization, setSelectedVisualization] = useState<
    string | null
  >(null); // Store selected visualization type
  const [chartData, setChartData] = useState<any>(null); // Store chart data
  const [fileData, setFileData] = useState<any>(null); // Store parsed file data for XLSX uploads

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      if (datasets.length === 0) {
        return;
      }

      const validDatasets = datasets.map((id) => ({ id }));

      try {
        const datasetPromises = validDatasets.map((dataset) =>
          axios.get(
            `https://data.abudhabi/opendata/api/1/metastore/schemas/dataset/items/${dataset.id}?show-reference-ids=false`
          )
        );
        const responses = await Promise.all(datasetPromises);

        const datasetsFetched = responses.map((response) => {
          const dataset = response.data;
          const datasetId = dataset?.identifier ?? "undefined";
          const downloadURL =
            dataset?.distribution?.[0]?.data?.downloadURL ?? null;

          return { ...dataset, datasetId, downloadURL }; // Include downloadURL
        });

        setDatasetDetails(datasetsFetched);
      } catch {
        setError("An error occurred while fetching dataset details.");
      }
    };

    fetchDatasetDetails();
  }, [datasets]);

  // Handler for selecting the visualization type
  const handleVisualizationSelect = async (
    type: string,
    datasetId: string,
    downloadURL: string | null
  ) => {
    setSelectedVisualization(type);

    if (downloadURL) {
      try {
        // Fetch the XLSX file
        const response = await axios.get(downloadURL, {
          responseType: "arraybuffer",
        });
        const data = new Uint8Array(response.data);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet); // Convert to JSON

        setFileData(jsonData); // Set the parsed data for XLSX
        // Generate chart data based on the XLSX content
        const chartData = generateChartData(type, jsonData);
        setChartData(chartData);
      } catch (err) {
        console.error("Error fetching or parsing XLSX:", err);
        setError("Error fetching or parsing XLSX data.");
      }
    }
  };

  // Function to generate chart data
  const generateChartData = (type: string, data: any) => {
    // Extract all keys (columns) from the data
    const keys = Object.keys(data[0]);

    // Ensure there are enough keys to plot
    if (keys.length < 2) {
      setError("Dataset does not have enough data to generate a chart.");
      return null;
    }

    // Use the first key as labels (e.g., x-axis values)
    const labelKey = keys[0];
    const labels = data.map((row: any) => row[labelKey]);

    // The rest of the keys are used as datasets
    const dataKeys = keys.slice(1);

    // Define colors for the datasets
    const colors = [
      {
        backgroundColor: "rgba(255,99,132,0.2)",
        borderColor: "rgba(255,99,132,1)",
      },
      {
        backgroundColor: "rgba(54,162,235,0.2)",
        borderColor: "rgba(54,162,235,1)",
      },
      {
        backgroundColor: "rgba(255,206,86,0.2)",
        borderColor: "rgba(255,206,86,1)",
      },
      // Add more colors if you have more datasets
    ];

    // Create datasets for the chart
    const datasets = dataKeys.map((key, index) => {
      const values = data.map((row: any) => Number(row[key]) || 0);
      return {
        label: key,
        data: values,
        backgroundColor: colors[index % colors.length].backgroundColor,
        borderColor: colors[index % colors.length].borderColor,
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  };

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-100 rounded-lg mt-4">
        {error}
      </div>
    );
  }

  if (datasetDetails.length === 0 && !fileData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex mb-8 mt-5 ml-8">
        <div className="text-black px-6 py-3 rounded-full shadow-lg">
          <h1 className="text-2xl font-bold">
            {datasetDetails.length} Dataset(s) Found
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {datasetDetails.map((dataset, index) => {
          const datasetId = dataset.datasetId || "undefined";
          const downloadURL = dataset.downloadURL;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              <a
                href={`https://data.abudhabi/opendata/dataset/detail?id=${datasetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  <div className="p-6 flex-grow">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">
                      {dataset.title || "Untitled Dataset"}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {dataset.description || "No description available"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Publisher:{" "}
                      {dataset.publisher?.data?.name || "Unknown Publisher"}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-gray-50">
                    <span className="inline-block bg-blue-200 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2">
                      #OpenData
                    </span>
                    <span className="inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
                      #AbuDhabi
                    </span>
                  </div>
                </div>
              </a>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (downloadURL) {
                      window.location.href = downloadURL; // Redirect to the download URL
                    } else {
                      alert("Download URL not available");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
                >
                  Download
                </button>

                {/* Visualize Button with Hover for Options */}
                <div className="relative group">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition"
                  >
                    Visualize
                  </button>

                  {/* Visualization Options Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      onClick={() =>
                        handleVisualizationSelect("bar", datasetId, downloadURL)
                      }
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      Bar Chart
                    </div>
                    <div
                      onClick={() =>
                        handleVisualizationSelect(
                          "line",
                          datasetId,
                          downloadURL
                        )
                      }
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      Line Chart
                    </div>
                    <div
                      onClick={() =>
                        handleVisualizationSelect(
                          "scatter",
                          datasetId,
                          downloadURL
                        )
                      }
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                    >
                      Scatter Plot
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Render Chart based on selected visualization */}
      {chartData && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Visualization</h2>
          {selectedVisualization === "bar" && <Bar data={chartData} />}
          {selectedVisualization === "line" && <Line data={chartData} />}
          {selectedVisualization === "scatter" && <Scatter data={chartData} />}
        </div>
      )}
    </div>
  );
}
