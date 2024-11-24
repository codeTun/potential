import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

interface SearchResultsComponentProps {
  datasets: string[];
}

export function SearchResultsComponent({
  datasets,
}: SearchResultsComponentProps) {
  const [datasetDetails, setDatasetDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          return { ...dataset, datasetId };
        });

        setDatasetDetails(datasetsFetched);
      } catch {
        setError("An error occurred while fetching dataset details.");
      }
    };

    fetchDatasetDetails();
  }, [datasets]);

  if (error) {
    return (
      <div className="text-center text-red-600 p-4 bg-red-100 rounded-lg mt-4">
        {error}
      </div>
    );
  }

  if (datasetDetails.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex  mb-8 mt-5 ml-8">
        <div className=" text-black px-6 py-3 rounded-full shadow-lg">
          <h1 className="text-2xl font-bold">
            {datasetDetails.length} Dataset(s) Found
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {datasetDetails.map((dataset, index) => {
          const datasetId = dataset.datasetId || "undefined";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
