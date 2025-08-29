import { useState } from "react";
import { Upload, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContributionSchema, insertPlantSchema } from "@shared/schema";
import { z } from "zod";

const contributionFormSchema = insertPlantSchema.extend({
  contributorName: z.string().min(1, "Name is required"),
});

type ContributionFormData = z.infer<typeof contributionFormSchema>;

export default function ContributionForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      name: "",
      scientificName: "",
      description: "",
      uses: "",
      preparation: "",
      location: "",
      contributorName: "",
    },
  });

  const contributionMutation = useMutation({
    mutationFn: async (data: ContributionFormData) => {
      // Create the plant entry
      const response = await apiRequest('POST', '/api/plants', {
        name: data.name,
        scientificName: data.scientificName,
        description: data.description,
        uses: data.uses,
        preparation: data.preparation,
        location: data.location,
        contributorId: null, // Anonymous for now
      });
      
      const plant = await response.json();
      
      // Create a contribution record
      await apiRequest('POST', '/api/contributions', {
        plantId: plant.id,
        contributorId: null,
        contributorName: data.contributorName,
        type: 'knowledge',
        content: `Plant: ${data.name}. Uses: ${data.uses}. ${data.preparation ? `Preparation: ${data.preparation}` : ''}`,
      });
      
      return plant;
    },
    onSuccess: () => {
      toast({
        title: "Contribution Submitted!",
        description: "Thank you for sharing your knowledge. It will be reviewed shortly.",
      });
      reset();
      setSelectedFiles([]);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contributions'] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your contribution. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContributionFormData) => {
    contributionMutation.mutate(data);
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
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording functionality
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Voice recording stopped" : "Start speaking about the plant...",
    });
  };

  return (
    <section id="contribute" className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4" data-testid="contribution-title">
            Share Your Knowledge
          </h3>
          <p className="text-muted-foreground" data-testid="contribution-description">
            Help preserve traditional medicinal plant wisdom by contributing to our community database
          </p>
        </div>
        
        <Card className="bg-card border border-border rounded-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="contribution-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Plant Name *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Common or local name"
                    className="w-full"
                    data-testid="input-plant-name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-plant-name">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="scientificName" className="block text-sm font-medium text-foreground mb-2">
                    Scientific Name
                  </Label>
                  <Input
                    id="scientificName"
                    {...register("scientificName")}
                    placeholder="Botanical name (if known)"
                    className="w-full"
                    data-testid="input-scientific-name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="uses" className="block text-sm font-medium text-foreground mb-2">
                  Medicinal Uses *
                </Label>
                <Textarea
                  id="uses"
                  {...register("uses")}
                  rows={4}
                  placeholder="Describe traditional uses, treatments, and benefits..."
                  className="w-full"
                  data-testid="textarea-uses"
                />
                {errors.uses && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-uses">
                    {errors.uses.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="preparation" className="block text-sm font-medium text-foreground mb-2">
                  Preparation Methods
                </Label>
                <Textarea
                  id="preparation"
                  {...register("preparation")}
                  rows={3}
                  placeholder="How is this plant prepared and used? (e.g., tea, paste, fresh consumption)"
                  className="w-full"
                  data-testid="textarea-preparation"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">
                  Plant Images
                </Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('image-input')?.click()}
                  data-testid="image-upload-area"
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Drop images here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-2">Multiple angles recommended</p>
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-primary mt-2" data-testid="selected-files-count">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="image-input"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contributorName" className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </Label>
                  <Input
                    id="contributorName"
                    {...register("contributorName")}
                    placeholder="For attribution"
                    className="w-full"
                    data-testid="input-contributor-name"
                  />
                  {errors.contributorName && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-contributor-name">
                      {errors.contributorName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Region where plant is found"
                    className="w-full"
                    data-testid="input-location"
                  />
                </div>
              </div>
              
              <Card className="bg-muted rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mic className="text-accent text-lg mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-2">Voice Contribution</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Prefer to speak? Record your knowledge and we'll transcribe it.
                    </p>
                    <Button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center space-x-2 ${
                        isRecording 
                          ? 'bg-destructive hover:bg-destructive/90' 
                          : 'bg-accent hover:bg-accent/90'
                      }`}
                      data-testid="voice-recording-button"
                    >
                      <Mic className="h-4 w-4" />
                      <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </Button>
                  </div>
                </div>
              </Card>
              
              <div className="flex items-center space-x-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  data-testid="submit-button"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Contribution"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Contributions are reviewed before publishing
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
