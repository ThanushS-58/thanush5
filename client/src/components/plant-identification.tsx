import { useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AudioButton from "@/components/audio-button";
import VoiceSelector from "@/components/voice-selector";
import LanguageSelector from "@/components/language-selector";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

interface IdentificationResult {
  plant: {
    id: string;
    name: string;
    scientificName: string;
    uses: string;
    description: string;
    preparation?: string;
    precautions?: string;
    hindiName?: string;
    sanskritName?: string;
    family?: string;
    partsUsed?: string;
    properties?: string;
    dosage?: string;
    translatedName?: string;
    translatedUses?: string;
    translatedDescription?: string;
    translatedPreparation?: string;
    translatedPrecautions?: string;
    // New Hindi content fields
    hindiDescription?: string;
    hindiUses?: string;
    hindiPreparation?: string;
    hindiPartsUsed?: string;
    hindiProperties?: string;
    hindiPrecautions?: string;
    hindiDosage?: string;
    hindiTherapeuticActions?: string;
    regionalNames?: string;
  };
  confidence: number;
  imageUrl: string;
}

export default function PlantIdentification() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const identifyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('language', language);
      
      // Try enhanced identification first for better accuracy
      try {
        const response = await apiRequest('POST', '/api/plants/identify-enhanced', formData);
        return response.json();
      } catch (error) {
        // Fallback to regular identification if enhanced fails
        console.log('Enhanced identification failed, trying regular method');
        const response = await apiRequest('POST', '/api/identify', formData);
        return response.json();
      }
    },
    onSuccess: (data: IdentificationResult) => {
      setIdentificationResult(data);
      toast({
        title: "Plant Identified!",
        description: `Found ${data.plant.name} with ${data.confidence}% confidence`,
      });
      // Invalidate plants query to refresh any cached data
      queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
    },
    onError: () => {
      toast({
        title: "Identification Failed",
        description: "Unable to identify the plant. Please try again with a clearer image.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setIdentificationResult(null);
      identifyMutation.mutate(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  return (
    <section id="identify" className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="identification-title">
          Discover Medicinal Plants with AI
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto" data-testid="identification-description">
          Upload a photo of any plant to identify it and learn about its traditional medicinal uses from community knowledge.
        </p>
        
        <div 
          className={`upload-area rounded-2xl p-12 mb-8 cursor-pointer transition-all ${dragActive ? 'border-primary bg-primary/5' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          data-testid="upload-area"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {identifyMutation.isPending ? (
                <Loader2 className="text-primary text-2xl animate-spin" data-testid="loading-spinner" />
              ) : (
                <Camera className="text-primary text-2xl" data-testid="camera-icon" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="upload-title">
              {identifyMutation.isPending ? "Identifying Plant..." : "Upload Plant Photo"}
            </h3>
            <p className="text-muted-foreground mb-4" data-testid="upload-instructions">
              {identifyMutation.isPending ? "Please wait while we analyze your image" : "Drop an image here or click to browse"}
            </p>
            {!identifyMutation.isPending && (
              <Button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors" data-testid="browse-button">
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            )}
          </div>
        </div>
        
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          data-testid="file-input"
        />
        
        {identificationResult && (
          <Card className="bg-card border border-border rounded-xl p-6" data-testid="identification-result">
            <CardContent className="p-0">
              <div className="space-y-4">
                <div className="flex items-start space-x-4 mb-6">
                  <img 
                    src={identificationResult.imageUrl} 
                    alt="Identified medicinal plant" 
                    className="w-24 h-24 rounded-lg object-cover"
                    data-testid="identified-image"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="text-xl font-semibold text-foreground mb-2" data-testid="plant-name">
                      {identificationResult.plant.translatedName || identificationResult.plant.name}
                      {identificationResult.plant.hindiName && (
                        <span className="text-lg text-muted-foreground ml-2">({identificationResult.plant.hindiName})</span>
                      )}
                    </h4>
                    <p className="text-muted-foreground mb-2" data-testid="scientific-name">
                      <em>{identificationResult.plant.scientificName}</em>
                      {identificationResult.plant.sanskritName && (
                        <span className="ml-2">• Sanskrit: {identificationResult.plant.sanskritName}</span>
                      )}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground" data-testid="confidence-score">
                        Confidence: {identificationResult.confidence}%
                      </span>
                      {identificationResult.plant.family && (
                        <span className="text-sm text-muted-foreground">• Family: {identificationResult.plant.family}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plant Details */}
                <div className="space-y-4 text-left">
                  {/* Description */}
                  {(identificationResult.plant.hindiDescription || identificationResult.plant.translatedDescription || identificationResult.plant.description) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">विवरण (Description):</h5>
                      <p className="text-muted-foreground">
                        {identificationResult.plant.hindiDescription || identificationResult.plant.translatedDescription || identificationResult.plant.description}
                      </p>
                    </div>
                  )}

                  {/* Medicinal Uses */}
                  {(identificationResult.plant.hindiUses || identificationResult.plant.translatedUses || identificationResult.plant.uses) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">पारंपरिक उपयोग (Traditional Uses):</h5>
                      <p className="text-muted-foreground">
                        {identificationResult.plant.hindiUses || identificationResult.plant.translatedUses || identificationResult.plant.uses}
                      </p>
                    </div>
                  )}

                  {/* Hindi Information Section */}
                  {(identificationResult.plant.hindiName || identificationResult.plant.sanskritName || identificationResult.plant.regionalNames) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">हिंदी और क्षेत्रीय नाम (Hindi & Regional Names):</h5>
                      <div className="text-muted-foreground space-y-1">
                        {identificationResult.plant.hindiName && (
                          <p><strong>Hindi:</strong> {identificationResult.plant.hindiName}</p>
                        )}
                        {identificationResult.plant.sanskritName && (
                          <p><strong>Sanskrit:</strong> {identificationResult.plant.sanskritName}</p>
                        )}
                        {identificationResult.plant.regionalNames && (
                          <p><strong>Regional Names:</strong> {identificationResult.plant.regionalNames}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preparation */}
                  {(identificationResult.plant.hindiPreparation || identificationResult.plant.translatedPreparation || identificationResult.plant.preparation) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">तैयारी (Preparation):</h5>
                      <p className="text-muted-foreground">
                        {identificationResult.plant.hindiPreparation || identificationResult.plant.translatedPreparation || identificationResult.plant.preparation}
                      </p>
                    </div>
                  )}

                  {/* Parts Used */}
                  {(identificationResult.plant.hindiPartsUsed || identificationResult.plant.partsUsed) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">उपयोग के भाग (Parts Used):</h5>
                      <p className="text-muted-foreground">{identificationResult.plant.hindiPartsUsed || identificationResult.plant.partsUsed}</p>
                    </div>
                  )}

                  {/* Properties */}
                  {(identificationResult.plant.hindiProperties || identificationResult.plant.properties) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">गुण (Properties):</h5>
                      <p className="text-muted-foreground">{identificationResult.plant.hindiProperties || identificationResult.plant.properties}</p>
                    </div>
                  )}

                  {/* Dosage */}
                  {(identificationResult.plant.hindiDosage || identificationResult.plant.dosage) && (
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">मात्रा (Dosage):</h5>
                      <p className="text-muted-foreground">{identificationResult.plant.hindiDosage || identificationResult.plant.dosage}</p>
                    </div>
                  )}

                  {/* Precautions */}
                  {(identificationResult.plant.translatedPrecautions || identificationResult.plant.precautions) && (
                    <div className="border-l-4 border-yellow-400 pl-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ सावधानियां (Precautions):</h5>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        {identificationResult.plant.hindiPrecautions || identificationResult.plant.translatedPrecautions || identificationResult.plant.precautions}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LanguageSelector />
                  <VoiceSelector 
                    onVoiceChange={setSelectedVoice}
                    selectedVoice={selectedVoice}
                    data-testid="voice-selector"
                  />
                  <div className="flex items-end">
                    <AudioButton 
                      text={`
                        ${identificationResult.plant.name} जिसे हिंदी में ${identificationResult.plant.hindiName || 'ज्ञात नहीं'} कहते हैं। 
                        ${identificationResult.plant.hindiDescription || identificationResult.plant.translatedDescription || identificationResult.plant.description}। 
                        पारंपरिक उपयोग: ${identificationResult.plant.hindiUses || identificationResult.plant.translatedUses || identificationResult.plant.uses}। 
                        ${identificationResult.plant.hindiPreparation ? `तैयारी: ${identificationResult.plant.hindiPreparation}।` : identificationResult.plant.translatedPreparation ? `तैयारी: ${identificationResult.plant.translatedPreparation}।` : identificationResult.plant.preparation ? `तैयारी: ${identificationResult.plant.preparation}।` : ''}
                        ${identificationResult.plant.hindiPrecautions ? `सावधानियां: ${identificationResult.plant.hindiPrecautions}।` : identificationResult.plant.translatedPrecautions ? `सावधानियां: ${identificationResult.plant.translatedPrecautions}।` : identificationResult.plant.precautions ? `सावधानियां: ${identificationResult.plant.precautions}।` : ''}
                      `.trim()}
                      selectedVoice={selectedVoice}
                      data-testid="listen-button"
                      size="md"
                      variant="primary"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
