import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PlantIdentification from '@/components/plant-identification';
import KnowledgeSearch from '@/components/knowledge-search';
import ContributionForm from '@/components/contribution-form';
import CommunitySection from '@/components/community-section';
import PlantGallery from '@/components/plant-gallery';
import CommunicationPanel from '@/components/communication-panel';
import { useLanguage } from '@/contexts/language-context';

export default function Home() {
  const [activeTab, setActiveTab] = useState('identify');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="identify">{t('identify')}</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="contribute">{t('contribute')}</TabsTrigger>
          </TabsList>

          <TabsContent value="identify" className="space-y-8">
            <PlantIdentification />
            <CommunitySection />
          </TabsContent>

          <TabsContent value="search">
            <KnowledgeSearch />
          </TabsContent>
          
          <TabsContent value="gallery">
            <PlantGallery />
          </TabsContent>
          
          <TabsContent value="communication">
            <CommunicationPanel />
          </TabsContent>

          <TabsContent value="contribute">
            <ContributionForm />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}