import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Image, 
  Plus, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Share2,
  Heart,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';

interface PlantImage {
  id: string;
  plantId: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  uploadDate: string;
  tags: string[];
  likes: number;
  isVerified: boolean;
  partOfPlant: 'whole' | 'leaves' | 'flowers' | 'roots' | 'bark' | 'fruits' | 'seeds';
}

interface PlantGalleryProps {
  plantId?: string;
  showControls?: boolean;
}

export default function PlantGallery({ plantId, showControls = true }: PlantGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<PlantImage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: plantImages = [] } = useQuery({
    queryKey: ['/api/plant-images', plantId],
  });

  const { data: plants = [] } = useQuery({
    queryKey: ['/api/plants'],
  });

  const likeImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest('POST', `/api/plant-images/${imageId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plant-images'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('POST', '/api/plant-images/upload', data);
    },
    onSuccess: () => {
      toast({
        title: 'Image Uploaded',
        description: 'Your plant image has been added to the gallery.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plant-images'] });
    },
  });

  // Filter images based on search and filters
  const filteredImages = (plantImages as PlantImage[]).filter((image: PlantImage) => {
    const matchesSearch = image.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plants as any[]).find((p: any) => p.id === image.plantId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterTag || image.tags.includes(filterTag) || image.partOfPlant === filterTag;
    const matchesPlant = !plantId || image.plantId === plantId;
    
    return matchesSearch && matchesFilter && matchesPlant;
  });

  const allTags = Array.from(new Set(
    (plantImages as PlantImage[]).flatMap((img: PlantImage) => [...img.tags, img.partOfPlant])
  ));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    if (plantId) {
      formData.append('plantId', plantId);
    }
    
    uploadImageMutation.mutate(formData);
  };

  const openImageModal = (image: PlantImage, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentImageIndex - 1 + filteredImages.length) % filteredImages.length
      : (currentImageIndex + 1) % filteredImages.length;
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  const getPlantName = (plantId: string) => {
    return (plants as any[]).find((p: any) => p.id === plantId)?.name || 'Unknown Plant';
  };

  return (
    <div className="space-y-6" data-testid="plant-gallery">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {plantId ? `${getPlantName(plantId)} Gallery` : 'Plant Image Gallery'}
          </h2>
          <p className="text-muted-foreground">
            {filteredImages.length} images available
          </p>
        </div>

        {showControls && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              data-testid="toggle-view-mode"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="upload-image-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Plant Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadImageMutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload high-quality images of medicinal plants to help the community identify them.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      {showControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search plants, captions, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="gallery-search-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                  data-testid="gallery-filter-select"
                >
                  <option value="">All Categories</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Grid/List */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Image className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Images Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterTag 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Be the first to upload an image to this gallery!'}
            </p>
            {showControls && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload First Image
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Plant Image</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadImageMutation.isPending}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {filteredImages.map((image: PlantImage, index: number) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div 
                className={`relative ${viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} cursor-pointer`}
                onClick={() => openImageModal(image, index)}
              >
                <img
                  src={image.url}
                  alt={image.caption || 'Plant image'}
                  className="w-full h-full object-cover"
                />
                {image.isVerified && (
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    Verified
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{getPlantName(image.plantId)}</h3>
                    <Badge variant="outline" className="text-xs">
                      {image.partOfPlant}
                    </Badge>
                  </div>
                  
                  {image.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.caption}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {image.uploadedBy}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          likeImageMutation.mutate(image.id);
                        }}
                        className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                      >
                        <Heart className="h-3 w-3" />
                        <span>{image.likes}</span>
                      </button>
                      <MessageCircle className="h-3 w-3" />
                    </div>
                  </div>
                  
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{image.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{getPlantName(selectedImage.plantId)}</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateImage('prev')}
                    disabled={filteredImages.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentImageIndex + 1} of {filteredImages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateImage('next')}
                    disabled={filteredImages.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.caption || 'Plant image'}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {selectedImage.caption && (
                    <p className="text-sm">{selectedImage.caption}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uploaded by {selectedImage.uploadedBy} on {new Date(selectedImage.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likeImageMutation.mutate(selectedImage.id)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {selectedImage.likes}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedImage.partOfPlant}</Badge>
                {selectedImage.isVerified && (
                  <Badge variant="default">Verified</Badge>
                )}
                {selectedImage.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}