// FILE: components/search-results.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Database, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

interface Dataset {
  "@search.score": number;
  chunk_id: string;
  parent_id: string;
  chunk: string;
  title: string;
}

interface ApiResponse {
  "@odata.context": string;
  value: Dataset[];
}

interface DatasetDetails {
  title: string;
  description: string;
  publisher: string;
}

export function SearchResultsComponent({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetDetails, setDatasetDetails] = useState<DatasetDetails | null>(
    null
  );

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery) return;

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching search results for query:", searchQuery);
        const response = await axios.post<ApiResponse>("/api/search", {
          search: searchQuery,
        });
        console.log("Search results response:", response.data);
        setDatasets(response.data.value || []);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setError("An error occurred while fetching results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery]);

  const fetchDatasetDetails = async (identifier: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching dataset details for ID:", identifier);
      const response = await axios.get(`/api/dataset?datasetId=${identifier}`);
      console.log("Dataset details response:", response.data);

      const data = response.data.data;
      console.log("Dataset details data:", data);

      const datasetDetail = {
        title: data.title || "Untitled Dataset",
        description: data.description || "No description available",
        publisher: data.publisher?.name || "Unknown Publisher",
      };

      setDatasetDetails(datasetDetail);
    } catch (error) {
      console.error("Error fetching dataset details:", error);
      setError(
        "An error occurred while fetching dataset details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const parseChunk = (
    chunk: string
  ): {
    title: string;
    description: string;
    publisher: string;
    identifier: string;
  } => {
    try {
      // Remove control characters
      const cleanedChunk = chunk.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

      // Regular expressions to extract fields
      const identifierRegex = /"identifier":\s*"([^"]+)"/;
      const titleRegex = /"title":\s*"([^"]+)"/;
      const descriptionRegex = /"description":\s*"([^"]+)"/;
      const publisherRegex = /"publisher":\s*{[^}]*"name":\s*"([^"]+)"[^}]*}/;

      const identifierMatch = cleanedChunk.match(identifierRegex);
      const titleMatch = cleanedChunk.match(titleRegex);
      const descriptionMatch = cleanedChunk.match(descriptionRegex);
      const publisherMatch = cleanedChunk.match(publisherRegex);

      const identifier = identifierMatch
        ? identifierMatch[1]
        : "Unknown Identifier";
      const title = titleMatch ? titleMatch[1] : "Untitled Dataset";
      const description = descriptionMatch
        ? descriptionMatch[1]
        : "No description available";
      const publisher = publisherMatch
        ? publisherMatch[1]
        : "Unknown Publisher";

      return {
        title,
        description,
        publisher,
        identifier,
      };
    } catch (error) {
      console.error("Error parsing chunk:", error);
      return {
        title: "Untitled Dataset",
        description: "No description available",
        publisher: "Unknown Publisher",
        identifier: "Unknown Identifier",
      };
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-700 to-blue-900">
      <div className="container mx-auto px-4">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center justify-center space-x-2"
            >
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </motion.div>
          ) : datasets.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                {datasets.length} Dataset{datasets.length !== 1 ? "s" : ""}{" "}
                Found
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map((dataset) => {
                  const { title, description, identifier } = parseChunk(
                    dataset.chunk
                  );
                  return (
                    <motion.div key={dataset.chunk_id} variants={itemVariants}>
                      <Card className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-none hover:bg-opacity-20 transition-all duration-300 cursor-pointer">
                        <CardContent className="p-6">
                          <Database className="h-8 w-8 text-blue-400 mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">
                            {title}
                          </h3>
                          <p className="text-blue-200 mb-4 line-clamp-3">
                            {description}
                          </p>
                          <div className="flex items-center text-blue-300">
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              Identifier: {identifier}
                            </span>
                          </div>
                          <Button
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => fetchDatasetDetails(identifier)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white"
              >
                <Search className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <h2 className="text-2xl font-semibold mb-2">
                  No datasets found
                </h2>
                <p className="text-blue-200">
                  Please try a different search query
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
        {datasetDetails && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4">{datasetDetails.title}</h3>
            <p className="mb-4">{datasetDetails.description}</p>
            <p className="text-sm text-gray-600">
              Publisher: {datasetDetails.publisher}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
