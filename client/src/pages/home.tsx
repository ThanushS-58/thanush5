import Header from "@/components/header";
import Footer from "@/components/footer";
import PlantIdentification from "@/components/plant-identification";
import KnowledgeSearch from "@/components/knowledge-search";
import ContributionForm from "@/components/contribution-form";
import CommunitySection from "@/components/community-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <PlantIdentification />
        <KnowledgeSearch />
        <ContributionForm />
        <CommunitySection />
      </main>
      
      <Footer />
    </div>
  );
}
