import { useState } from "react";
import { Search, Leaf, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AudioButton from "@/components/audio-button";
import KnowledgeContribution from "@/components/knowledge-contribution";
import { useQuery } from "@tanstack/react-query";
import { Plant } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const { t } = useLanguage();

  // Fetch all plants
  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ['/api/plants'],
  });

  // Search plants
  const { data: searchResults = [] } = useQuery<Plant[]>({
    queryKey: ['/api/plants/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/plants/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.length >= 2);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 2) {
      setShowResults(true);
    }
  };

  // Featured plants (first 3 from all plants)
  const featuredPlants = plants.slice(0, 3);

  return (
    <section id="knowledge" className="bg-muted/30 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h3 className="text-3xl font-bold text-foreground mb-4" data-testid="search-title">
                {t('knowledge.searchTitle') || 'Search Plant Knowledge'}
              </h3>
              <p className="text-muted-foreground" data-testid="search-description">
                {t('knowledge.searchDescription') || 'Explore our community-driven database of medicinal plants'}
              </p>
            </div>
            
            <Dialog open={showContributionForm} onOpenChange={setShowContributionForm}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="add-knowledge-button">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('knowledge.addNew') || 'Add Knowledge'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <KnowledgeContribution onClose={() => setShowContributionForm(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="search-container max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="text"
              placeholder="Search by plant name, medicinal use, or symptom..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-6 py-4 pr-12 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="search-input"
            />
            <Button
              type="submit"
              variant="ghost"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
              data-testid="search-button"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          {showResults && searchResults.length > 0 && (
            <div className="search-results mt-2" data-testid="search-results">
              {searchResults.slice(0, 5).map((plant) => (
                <div key={plant.id} className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Leaf className="text-primary h-4 w-4" />
                    <div>
                      <p className="font-medium text-foreground" data-testid={`result-name-${plant.id}`}>
                        {plant.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`result-uses-${plant.id}`}>
                        {plant.uses}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Featured Plants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="plant-card bg-card border border-border rounded-xl overflow-hidden">
                <div className="w-full h-48 bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-16 bg-muted rounded animate-pulse" />
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-muted rounded animate-pulse w-20" />
                      <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            featuredPlants.map((plant) => (
              <Card key={plant.id} className="plant-card bg-card border border-border rounded-xl overflow-hidden" data-testid={`plant-card-${plant.id}`}>
                <img 
                  src={plant.imageUrl || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e"} 
                  alt={`${plant.name} medicinal plant`} 
                  className="w-full h-48 object-cover"
                  data-testid={`plant-image-${plant.id}`}
                />
                <CardContent className="p-6">
                  <h4 className="text-xl font-semibold text-foreground mb-2" data-testid={`plant-name-${plant.id}`}>
                    {plant.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`plant-scientific-name-${plant.id}`}>
                    {plant.scientificName}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-foreground">Uses:</span>
                      <p className="text-sm text-muted-foreground" data-testid={`plant-uses-${plant.id}`}>
                        {plant.uses}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <AudioButton 
                        text={`${plant.name}. ${plant.description || 'A medicinal plant'}. Traditional uses include: ${plant.uses}`}
                        variant="primary"
                        size="sm"
                        data-testid={`audio-button-${plant.id}`}
                      />
                      <span className="text-xs text-muted-foreground" data-testid={`contributors-count-${plant.id}`}>
                        {Math.floor(Math.random() * 10) + 1} contributors
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
