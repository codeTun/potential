import { useState, useEffect } from "react";
import axios from "axios";

interface SearchResultsComponentProps {
  datasets: string[]; // The list of dataset ids passed as strings
}

export function SearchResultsComponent({ datasets }: SearchResultsComponentProps) {
  const [datasetDetails, setDatasetDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      if (datasets.length === 0) {
        console.log("No datasets provided");
        return; // Don't fetch if no datasets
      }

      console.log("Datasets received:", datasets);

      // Flatten the datasets if they are in arrays
      const validDatasets = datasets.map(dataset => {
        // If the dataset is an array, extract the first element as 'id'
        return Array.isArray(dataset) ? { id: dataset[0] } : { id: dataset };
      });

      console.log("Valid datasets:", validDatasets);

      if (validDatasets.length === 0) {
        setError("No valid datasets available.");
        return;
      }

      try {
        const datasetPromises = validDatasets.map((dataset) =>
          axios.get(
            `https://data.abudhabi/opendata/api/1/metastore/schemas/dataset/items/${dataset.id}?show-reference-ids=false`
          )
        );
        const responses = await Promise.all(datasetPromises);

        const datasetsFetched = responses.map((response, index) => {
          console.log(`Fetched dataset response at index ${index}:`, response.data); // Log the full dataset response

          // Check for the identifier in the full response structure
          const dataset = response.data;

          // Let's log the whole response and try to see where the identifier is
          console.log('Full Response:', dataset); 

          // Use the 'identifier' directly from the response if available
          const datasetId = dataset?.identifier ?? "undefined"; 

          return { ...dataset, datasetId };
        });

        setDatasetDetails(datasetsFetched);
      } catch (error) {
        console.error("Error fetching dataset details:", error);
        setError("An error occurred while fetching dataset details.");
      }
    };

    fetchDatasetDetails();
  }, [datasets]); // Trigger API call only when datasets change

  if (error) {
    return <div>{error}</div>;
  }

  if (datasetDetails.length === 0) {
    return <div>Loading datasets...</div>;
  }

  return (
    <div>
      {datasetDetails.map((dataset, index) => {
        const datasetId = dataset.datasetId || "undefined"; // Ensure we use the fallback

        if (datasetId === "undefined") {
          console.warn(`Dataset ID is missing for dataset at index ${index}`);
        }

        return (
          <div key={index}>
            {/* Clickable card that navigates to the dataset URL */}
            <a
              href={`https://data.abudhabi/opendata/dataset/detail?id=${datasetId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                <h2>{dataset.title || "Untitled Dataset"}</h2>
                <p>{dataset.description || "No description available"}</p>
                <p>Publisher: {dataset.publisher?.data?.name || "Unknown Publisher"}</p>
              </div>
            </a>
          </div>
        );
      })}
    </div>
  );
}
