import { User, ThumbsUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Contribution } from "@shared/schema";

interface Stats {
  plantsIdentified: number;
  contributors: number;
  knowledgeEntries: number;
  languagesSupported: number;
}

export default function CommunitySection() {
  // Fetch app statistics
  const { data: stats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch recent contributions
  const { data: contributions = [] } = useQuery<Contribution[]>({
    queryKey: ['/api/contributions'],
    staleTime: 30000, // Cache for 30 seconds
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const contributionDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - contributionDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section id="community" className="bg-muted/30 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4" data-testid="community-title">
            Community Impact
          </h3>
          <p className="text-muted-foreground" data-testid="community-description">
            Together we're preserving traditional knowledge for future generations
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center" data-testid="stat-plants-identified">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats?.plantsIdentified || 0}
            </div>
            <p className="text-muted-foreground">Plants Identified</p>
          </div>
          <div className="text-center" data-testid="stat-contributors">
            <div className="text-4xl font-bold text-accent mb-2">
              {stats?.contributors || 0}
            </div>
            <p className="text-muted-foreground">Contributors</p>
          </div>
          <div className="text-center" data-testid="stat-knowledge-entries">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats?.knowledgeEntries || 0}
            </div>
            <p className="text-muted-foreground">Knowledge Entries</p>
          </div>
          <div className="text-center" data-testid="stat-languages">
            <div className="text-4xl font-bold text-accent mb-2">
              {stats?.languagesSupported || 0}
            </div>
            <p className="text-muted-foreground">Languages</p>
          </div>
        </div>
        
        {/* Recent Contributions */}
        <Card className="bg-card border border-border rounded-xl">
          <CardContent className="p-8">
            <h4 className="text-xl font-semibold text-foreground mb-6" data-testid="recent-contributions-title">
              Recent Contributions
            </h4>
            <div className="space-y-6">
              {contributions.length === 0 ? (
                <div className="text-center py-8" data-testid="no-contributions">
                  <p className="text-muted-foreground">No contributions yet. Be the first to share your knowledge!</p>
                </div>
              ) : (
                contributions.slice(0, 3).map((contribution) => (
                  <div 
                    key={contribution.id} 
                    className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg"
                    data-testid={`contribution-${contribution.id}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-foreground" data-testid={`contributor-name-${contribution.id}`}>
                          {contribution.contributorName}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground flex items-center" data-testid={`contribution-time-${contribution.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(contribution.createdAt!)}
                        </span>
                      </div>
                      <p className="text-foreground mb-2" data-testid={`contribution-content-${contribution.id}`}>
                        Shared knowledge about traditional plant medicine
                      </p>
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`contribution-summary-${contribution.id}`}>
                        {contribution.content.length > 100 
                          ? `${contribution.content.substring(0, 100)}...` 
                          : contribution.content
                        }
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={getStatusColor(contribution.status || 'pending')}
                          data-testid={`contribution-status-${contribution.id}`}
                        >
                          {contribution.status === 'approved' ? 'Verified' : 
                           contribution.status === 'pending' ? 'Under Review' : 
                           'Rejected'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          data-testid={`like-button-${contribution.id}`}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {Math.floor(Math.random() * 20) + 1}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {contributions.length > 0 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="link" 
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                    data-testid="view-all-contributions"
                  >
                    View All Contributions →
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
