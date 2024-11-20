import { useState, useEffect } from "react";
import axios from "axios";

interface DatasetDetails {
  title: string;
  description: string;
  publisher: string;
}

export function SearchResultsComponent() {
  const datasetIds = ["99e7dfe1-d73d-4000-b067-a6aac521594d"];
  const [datasets, setDatasets] = useState<DatasetDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllDatasetDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedDatasets: DatasetDetails[] = [];

        // Fetch all datasets
        await Promise.all(
          datasetIds.map(async (id) => {
            const response = await axios.get(`/api/dataset?datasetId=${id}`);
            const data = response.data;

            // Extract required fields
            const dataset: DatasetDetails = {
              title: data.title || "Untitled Dataset",
              description: data.description || "No description available",
              publisher: data.publisher?.data?.name || "Unknown Publisher",
            };

            fetchedDatasets.push(dataset);
          })
        );

        setDatasets(fetchedDatasets);
      } catch (err) {
        console.error("Error fetching dataset details:", err);
        setError(
          "An error occurred while fetching dataset details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllDatasetDetails();
  }, []); // Dependency array ensures it only runs once

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && datasets.length === 0 && <p>No datasets found.</p>}
      <ul>
        {datasets.map((dataset, index) => (
          <li key={index}>
            <h3>{dataset.title}</h3>
            <p>{dataset.description}</p>
            <p>
              <strong>Publisher:</strong> {dataset.publisher}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
