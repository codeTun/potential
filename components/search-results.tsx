// components/search-results.tsx
"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import axios from "axios";
import * as XLSX from "xlsx";
import { Bar, Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement, // Added PointElement
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the required chart components, including PointElement
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement, // Register PointElement
  Title,
  Tooltip,
  Legend
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
    "Table" | "Bar" | "Line" | null
  >(null);
  const [fileData, setFileData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any>(null);
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [currentDownloadURL, setCurrentDownloadURL] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      if (datasets.length === 0) {
        setError("No datasets available.");
        toast.error("No datasets available.");
        return;
      }

      try {
        const datasetPromises = datasets.map((id) =>
          axios.get(
            `https://data.abudhabi/opendata/api/1/metastore/schemas/dataset/items/${id}?show-reference-ids=false`
          )
        );
        const responses = await Promise.all(datasetPromises);

        const datasetsFetched = responses.map((response) => {
          const dataset = response.data;
          const datasetId = dataset?.identifier ?? "undefined";
          const downloadURL =
            dataset?.distribution?.[0]?.data?.downloadURL ?? null;

          return { ...dataset, datasetId, downloadURL };
        });

        setDatasetDetails(datasetsFetched);
      } catch (err) {
        console.error("Error fetching dataset details:", err);
        setError("An error occurred while fetching dataset details.");
        toast.error("An error occurred while fetching dataset details.");
      }
    };

    fetchDatasetDetails();
  }, [datasets]);

  const handleVisualizeClick = (
    datasetId: string,
    downloadURL: string | null
  ) => {
    if (!downloadURL) {
      setError("Download URL is not available.");
      toast.error("Download URL is not available.");
      return;
    }
    setCurrentDatasetId(datasetId);
    setCurrentDownloadURL(downloadURL);
    setIsModalOpen(true);
  };

  const handleVisualizationSelect = async (type: "Table" | "Bar" | "Line") => {
    setSelectedVisualization(type);
  
    if (currentDownloadURL) {
      try {
        const fileExtension = currentDownloadURL.split(".").pop()?.toLowerCase();
  
        let parsedData: any = null;
        const proxyUrl = `/api/proxyDownload?url=${encodeURIComponent(currentDownloadURL)}`;
  
        if (fileExtension === "xlsx") {
          const response = await axios.get(proxyUrl, { responseType: "arraybuffer" });
          const data = new Uint8Array(response.data);
          const workbook = XLSX.read(data, { type: "array" });
  
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) throw new Error("Sheet is undefined or null.");
  
          parsedData = XLSX.utils.sheet_to_json(sheet);
        } else if (fileExtension === "csv") {
          const response = await axios.get(proxyUrl, { responseType: "text" });
          const csvText = response.data;
  
          const parsedCSV = Papa.parse(csvText, { header: true, skipEmptyLines: true });
          if (parsedCSV.errors.length > 0) throw new Error("CSV parsing errors occurred.");
          parsedData = parsedCSV.data;
  
          if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("CSV data is empty or invalid.");
          }
        } else {
          throw new Error("Invalid file type. Only CSV and XLSX are supported.");
        }
  
        // Check if the parsed data is empty
        if (!parsedData || parsedData.length === 0) {
          throw new Error("Dataset is empty or invalid.");
        }
  
        setFileData(parsedData);
  
        if (type === "Bar" || type === "Line") {
          const chartData = generateChartData(parsedData, type);
          if (chartData) {
            setChartData(chartData);
          } else {
            throw new Error("Not enough data to generate chart.");
          }
        }
      } catch (err: any) {
        console.error("Error fetching or parsing data:", err);
        setError(
          err.message === "Invalid file type. Only CSV and XLSX are supported."
            ? err.message
            : "Error fetching or parsing dataset. File content might be corrupted."
        );
        toast.error(
          err.message === "Invalid file type. Only CSV and XLSX are supported."
            ? "Invalid file type. Only CSV and XLSX are supported."
            : "Error fetching or parsing dataset. File content might be corrupted."
        );
      }
    } else {
      setError("Download URL is not available.");
      toast.error("Download URL is not available.");
    }
  };  
  

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFileData(null);
    setChartData(null);
    setSelectedVisualization(null);
    setCurrentDatasetId(null);
    setCurrentDownloadURL(null);
    setError(null);
  };

  const getTableData = (data: any) => {
    const length = data.length;
    if (length === 0) {
      return { head: [], middle: [], tail: [] };
    }
    const head = data.slice(0, 5);
    const tail = data.slice(Math.max(length - 5, 0));
    const middle = data.slice(
      Math.floor(length / 2) - 2,
      Math.floor(length / 2) + 3
    );

    return { head, middle, tail };
  };

  const generateChartData = (data: any, type: "Bar" | "Line") => {
    const keys = Object.keys(data[0]);
  
    if (keys.length < 2) {
      setError("Not enough data to generate chart.");
      toast.error("Not enough data to generate chart.");
      return null;
    }
  
    // Assuming the first key is for labels and the rest are for dataset values
    const labelKey = keys[0]; // This key will be used as labels for the x-axis
    const datasets = keys.slice(1).map((key) => {
      const datasetValues = data.map((row: any) => {
        const value = Number(row[key]);
        return isNaN(value) ? 0 : value;  // Ensure the value is a number or fallback to 0
      });
  
      return {
        label: key, // Label for each dataset based on the key
        data: datasetValues,
        backgroundColor: type === "Bar" ? "rgba(75, 192, 192, 0.5)" : undefined,
        borderColor: type === "Line" ? "rgba(75, 192, 192, 1)" : undefined,
        fill: type === "Line" ? false : undefined,
      };
    });
  
    const labels = data.map((row: any) => String(row[labelKey]) || "Unknown");
  
    if (datasets.every((dataset) => dataset.data.every((value: any) => value === 0))) {
      setError("All data points are 0 or invalid.");
      toast.error("All data points are 0 or invalid.");
      return null;
    }
  
    return {
      labels, // Labels array for the x-axis
      datasets, // Array of datasets
    };
  };
  

  return (
    <div>
      <div className="flex justify-between items-center mb-8 mt-5 ml-8">
        <div className="text-black px-6 py-3 rounded-full shadow-lg">
          <h1 className="text-2xl font-bold">
            {datasetDetails.length} Dataset(s) Found
          </h1>
        </div>
      </div>
      {error && (
        <div className="text-center text-red-600 p-4 bg-red-100 rounded-lg mt-4">
          {error}
        </div>
      )}
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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
              <div className="p-6 flex-grow">
  <h2 className="text-2xl font-bold mb-2 text-gray-800">
    <a
      href={`https://data.abudhabi/opendata/dataset/detail?id=${dataset.datasetId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-black-600 hover:underline"
    >
      {dataset.title || "Untitled Dataset"}
    </a>
  </h2>
  <p className="text-gray-600 mb-4 line-clamp-3">
    {dataset.description || "No description available"}
  </p>
  <p className="text-sm text-gray-500">
    Publisher:{" "}
    {dataset.publisher?.data?.name || "Unknown Publisher"}
  </p>
</div>
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="inline-block bg-blue-200 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2">
                      #OpenData
                    </span>
                    <span className="inline-block bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
                      #AbuDhabi
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={downloadURL || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-green-500 hover:bg-green-600 text-white rounded-md py-1 px-3 text-sm"
                    >
                      Download
                    </a>
                    <button
                      onClick={() =>
                        handleVisualizeClick(datasetId, downloadURL)
                      }
                      className="btn bg-blue-500 hover:bg-blue-600 text-white rounded-md py-1 px-3 text-sm"
                    >
                      Visualize
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={handleCloseModal}
          ></div>
          <div className="bg-white rounded-lg p-6 z-50 max-w-5xl w-full max-h-full overflow-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            {!selectedVisualization ? (
              <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  Select Visualization Type
                </h3>
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => handleVisualizationSelect("Table")}
                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md py-3 px-6 text-lg"
                  >
                    Table
                  </button>
                  <button
                    onClick={() => handleVisualizationSelect("Bar")}
                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md py-3 px-6 text-lg"
                  >
                    Bar Chart
                  </button>
                  <button
                    onClick={() => handleVisualizationSelect("Line")}
                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md py-3 px-6 text-lg"
                  >
                    Line Chart
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {fileData && selectedVisualization === "Table" && (
                  <div className="mt-6">
                    <h3 className="text-2xl font-semibold mb-4 text-center">
                      Table Visualization
                    </h3>
                    <div className="overflow-x-auto">
                      {["head", "middle", "tail"].map((part) => {
                        const { head, middle, tail } = getTableData(fileData);
                        const rows =
                          part === "head"
                            ? head
                            : part === "middle"
                            ? middle
                            : tail;

                        if (rows.length === 0) {
                          return null;
                        }

                        return (
                          <div key={part} className="mb-8">
                            <h4 className="text-xl font-semibold mb-2 capitalize text-gray-700">
                              {part}
                            </h4>
                            <table className="min-w-full table-auto mb-4 border">
                              <thead>
                                <tr className="text-left bg-gray-100">
                                  {Object.keys(rows[0] || {}).map((key) => (
                                    <th
                                      key={key}
                                      className="border px-4 py-2 bg-gray-200 text-gray-600"
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    {Object.entries(row).map(([key, value]) => (
                                      <td
                                        key={key}
                                        className="border px-4 py-2 text-gray-700"
                                      >
                                        {String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {chartData && selectedVisualization === "Bar" && (
                  <div className="mt-6">
                    <h3 className="text-2xl font-semibold mb-4 text-center">
                      Bar Chart
                    </h3>
                    <div className="max-w-3xl mx-auto">
                      <Bar data={chartData} />
                    </div>
                  </div>
                )}
                 {chartData ? (
          <>
            {selectedVisualization === "Bar" && (
              <Bar data={chartData} options={{ responsive: true }} />
            )}
            {selectedVisualization === "Line" && (
              <Line data={chartData} options={{ responsive: true }} />
            )}
          </>
        ) : (
          <div className="text-center">Loading chart...</div>
        )}
                {error && (
                  <div className="text-center text-red-600 p-4 bg-red-100 rounded-lg mt-4">
                    {error}
                  </div>
                )}
                {!fileData && !error && (
                  <div className="text-center text-gray-700 p-4 bg-gray-100 rounded-lg mt-4">
                    The dataset is empty. Cannot visualize.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}