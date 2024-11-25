import { useState, useEffect } from "react";
import Papa from "papaparse";
import axios from "axios";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

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
  const [hoveredDatasetId, setHoveredDatasetId] = useState<string | null>(null);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

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

          return { ...dataset, datasetId, downloadURL }; 
        });

        setDatasetDetails(datasetsFetched);
      } catch {
        setError("An error occurred while fetching dataset details.");
      }
    };

    fetchDatasetDetails();
  }, [datasets]);

  const handleVisualizationSelect = async (
      type: "Table" | "Bar" | "Line",
      datasetId: string,
      downloadURL: string | null
    ) => {
    setSelectedVisualization(type);

    if (downloadURL) {
      try {
        const fileExtension = downloadURL.split('.').pop()?.toLowerCase();
        
        let parsedData = null;
  
        if (fileExtension === "xlsx") {
          const response = await axios.get(downloadURL, {
            responseType: "arraybuffer",
          });
          const data = new Uint8Array(response.data);
          const workbook = XLSX.read(data, { type: "array" });
  
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
  
          if (!sheet) throw new Error("Sheet is undefined or null.");
  
          parsedData = XLSX.utils.sheet_to_json(sheet); 
        } else if (fileExtension === "csv") {
          const response = await axios.get(downloadURL, {
            responseType: "blob",
          });
          const csvText = await response.data.text();
          const parsedCSV = Papa.parse(csvText, { header: true });
  
          if (parsedCSV.errors.length > 0) {
            throw new Error("CSV parsing errors occurred.");
          }
          parsedData = parsedCSV.data;
        } else {
          throw new Error("Unsupported file type. Only XLSX and CSV are supported.");
        }
  
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
          throw new Error("Parsed data is empty or invalid.");
        }
  
        setFileData(parsedData);
      } catch (err) {
        console.error("Error fetching or parsing data:", err);
        setError("Error fetching or parsing dataset. Ensure the file format is valid.");
      }
    } else {
      setError("Download URL is not available.");
    }
  };

  const getTableData = (data: any) => {
    const length = data.length;
    const head = data.slice(0, 5); // Get first 5 rows
    const tail = data.slice(Math.max(length - 5, 0)); // Get last 5 rows
    const middle = data.slice(Math.floor(length / 2) - 2, Math.floor(length / 2) + 3); // Get middle 5 rows

    return { head, middle, tail };
  };

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

              {/* Buttons */}
              <div className="absolute top-5 right-5 flex flex-col space-y-2">
                {/* Download Button */}
                <a
                  href={downloadURL || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-green-500 text-white rounded-md py-2 px-4"
                >
                  Download
                </a>

                {/* Visualize Button */}
                <button
                  onMouseEnter={() => setHoveredButtonId(datasetId)}
                  onMouseLeave={() => setHoveredButtonId(null)}
                  className="btn bg-blue-500 text-white rounded-md py-2 px-4"
                >
                  Visualize
                </button>

                {/* Dropdown for Visualize button when hovered */}
                {hoveredButtonId === datasetId && (
                  <div
                    className="absolute top-10 right-0 bg-white shadow-md rounded-md w-32 z-10"
                    onMouseEnter={() => setHoveredButtonId(datasetId)}
                    onMouseLeave={() => setHoveredButtonId(null)}
                  >
                    <button
                      onClick={() =>
                        handleVisualizationSelect("Table", datasetId, downloadURL)
                      }
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Table
                    </button>
                    <button
                      onClick={() =>
                        handleVisualizationSelect("Bar", datasetId, downloadURL)
                      }
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Bar
                    </button>
                    <button
                      onClick={() =>
                        handleVisualizationSelect("Line", datasetId, downloadURL)
                      }
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Line
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Data Visualization */}
      <div>
        {fileData && selectedVisualization === "Table" && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Table Visualization</h3>
            <div>
              {["head", "middle", "tail"].map((part) => {
                const { head, middle, tail } = getTableData(fileData);
                const rows =
                  part === "head" ? head : part === "middle" ? middle : tail;
                return (
                  <div key={part}>
                    <h4 className="text-lg font-semibold mb-2">{part}</h4>
                    <table className="min-w-full table-auto mb-4 border">
                      <thead>
                        <tr className="text-left bg-gray-100">
                          {Object.keys(rows[0] || {}).map((key) => (
                            <th
                              key={key}
                              className="border px-4 py-2 text-left bg-gray-100"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row: any, idx: number) => (
                          <tr key={idx}>
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="border px-4 py-2">
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
      </div>
    </div>
  );
}
