import { useState } from "react";
import { Plus, Leaf, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { insertPlantSchema } from "@shared/schema";
import { z } from "zod";

const knowledgeFormSchema = insertPlantSchema.extend({
  contributorName: z.string().min(1, "Contributor name is required"),
});

type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

interface KnowledgeContributionProps {
  onClose?: () => void;
}

export default function KnowledgeContribution({ onClose }: KnowledgeContributionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const form = useForm<KnowledgeFormData>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      name: "",
      scientificName: "",
      description: "",
      uses: "",
      preparation: "",
      location: "",
      imageUrl: "",
      contributorName: "",
      verificationStatus: "pending",
    },
  });

  const submitKnowledgeMutation = useMutation({
    mutationFn: async (data: KnowledgeFormData) => {
      return apiRequest('POST', '/api/plants', data);
    },
    onSuccess: () => {
      toast({
        title: t('knowledge.submitted') || 'Knowledge Submitted',
        description: t('knowledge.submittedDesc') || 'Your plant knowledge has been submitted for review.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
      form.reset();
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: t('knowledge.error') || 'Submission Error',
        description: error.message || 'Failed to submit knowledge',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const onSubmit = (data: KnowledgeFormData) => {
    setIsSubmitting(true);
    submitKnowledgeMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border border-border" data-testid="knowledge-contribution-form">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Leaf className="h-5 w-5 text-primary" />
          <span>{t('knowledge.addPlant') || 'Add Plant Knowledge'}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('knowledge.plantName') || 'Plant Name'} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('knowledge.plantNamePlaceholder') || 'e.g., Turmeric'}
                        {...field}
                        data-testid="input-plant-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scientificName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('knowledge.scientificName') || 'Scientific Name'}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('knowledge.scientificNamePlaceholder') || 'e.g., Curcuma longa'}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        data-testid="input-scientific-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('knowledge.description') || 'Description'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('knowledge.descriptionPlaceholder') || 'Describe the plant\'s appearance, habitat, and characteristics...'}
                      rows={3}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('knowledge.medicinalUses') || 'Medicinal Uses'} *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('knowledge.usesPlaceholder') || 'List traditional medicinal uses, benefits, and applications...'}
                      rows={3}
                      {...field}
                      data-testid="textarea-uses"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preparation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('knowledge.preparation') || 'Preparation Methods'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('knowledge.preparationPlaceholder') || 'How to prepare and use this plant for medicinal purposes...'}
                      rows={2}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      data-testid="textarea-preparation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('knowledge.location') || 'Found In'}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('knowledge.locationPlaceholder') || 'Region or habitat where it grows'}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contributorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('knowledge.contributorName') || 'Your Name'} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('knowledge.contributorNamePlaceholder') || 'Your name for attribution'}
                        {...field}
                        data-testid="input-contributor-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('knowledge.imageUrl') || 'Image URL (Optional)'}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('knowledge.imageUrlPlaceholder') || 'Link to plant image'}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      data-testid="input-image-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-4">
              {onClose && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="ml-auto"
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t('knowledge.submitting') || 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('knowledge.submit') || 'Submit Knowledge'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}