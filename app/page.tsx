// FILE: app/page.tsx
"use client";

import { useState } from "react";
import { Footer } from "@/components/footer";
import { HeroSectionComponent } from "@/components/hero-section";
import { SearchResultsComponent } from "@/components/search-results";
import { PotentialSection } from "@/components/potential-section-with-chat";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      <HeroSectionComponent onSearch={handleSearch} />
      <SearchResultsComponent searchQuery={searchQuery} />
      <PotentialSection />
      <Footer />
    </>
  );
}
