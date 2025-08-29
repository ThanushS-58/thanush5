import { useState } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AudioButton from "@/components/audio-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface IdentificationResult {
  plant: {
    id: string;
    name: string;
    scientificName: string;
    uses: string;
    description: string;
  };
  confidence: number;
  imageUrl: string;
}

export default function PlantIdentification() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const identifyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiRequest('POST', '/api/identify', formData);
      return response.json();
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
              <div className="flex items-start space-x-4">
                <img 
                  src={identificationResult.imageUrl} 
                  alt="Identified medicinal plant" 
                  className="w-24 h-24 rounded-lg object-cover"
                  data-testid="identified-image"
                />
                <div className="flex-1 text-left">
                  <h4 className="text-xl font-semibold text-foreground mb-2" data-testid="plant-name">
                    {identificationResult.plant.name}
                  </h4>
                  <p className="text-muted-foreground mb-4" data-testid="scientific-name">
                    {identificationResult.plant.scientificName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <AudioButton 
                      text={`${identificationResult.plant.name}. ${identificationResult.plant.description}. Traditional uses include: ${identificationResult.plant.uses}`}
                      data-testid="listen-button"
                    />
                    <span className="text-sm text-muted-foreground" data-testid="confidence-score">
                      Confidence: {identificationResult.confidence}%
                    </span>
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
