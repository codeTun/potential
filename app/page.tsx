"use client";

import { useState } from "react";
import { Footer } from "@/components/footer";
import { HeroSectionComponent } from "@/components/hero-section";
import { SearchResultsComponent } from "@/components/search-results";
import { PotentialSection } from "@/components/potential-section-with-chat";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [datasetIds, setDatasetIds] = useState<string[]>([]); // Array to store dataset IDs
  const [datasets, setDatasets] = useState<any[]>([]); // Array to store dataset details

  const handleSearch = (query: string) => {
    setSearchQuery(query); // Update the search query
    // Here you could trigger an API call to get dataset IDs based on the search query
    // For now, just simulate setting datasetIds for demo purposes:
    if (query) {
      setDatasetIds([`Dataset 1 for "${query}"`, `Dataset 2 for "${query}"`]);
    }
  };

  // Handle the datasets received from PotentialSection
  const handlePotentialDatasets = (newDatasets: any[]) => {
    setDatasets(newDatasets); // Update datasets when new data is available
  };

  return (
    <>
      <HeroSectionComponent onSearch={handleSearch} />
      <PotentialSection externalQuery={searchQuery} onDatasetsChange={handlePotentialDatasets} />
      {datasets.length > 0 && <SearchResultsComponent datasets={datasets} />}
      <Footer />
    </>
  );
}
