import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Image, 
  CheckCircle, 
  XCircle, 
  Search,
  Settings,
  BarChart3,
  UserCheck,
  Flag
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import WhatsAppIntegration from '@/components/whatsapp-integration';

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You need administrator privileges to access this panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: adminStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: pendingContributions = [] } = useQuery({
    queryKey: ['/api/admin/pending-contributions'],
  });

  const { data: reportedContent = [] } = useQuery({
    queryKey: ['/api/admin/reported-content'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const moderateContentMutation = useMutation({
    mutationFn: async (data: { id: string; action: 'approve' | 'reject'; type: 'contribution' | 'report' }) => {
      return apiRequest('POST', `/api/admin/moderate`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Action Completed',
        description: 'Content has been moderated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; isAdmin: boolean }) => {
      return apiRequest('PATCH', `/api/admin/users/${data.userId}`, { isAdmin: data.isAdmin });
    },
    onSuccess: () => {
      toast({
        title: 'User Role Updated',
        description: 'User permissions have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
  });

  const handleModerateContent = (id: string, action: 'approve' | 'reject', type: 'contribution' | 'report') => {
    moderateContentMutation.mutate({ id, action, type });
  };

  const handleToggleAdminRole = (userId: string, currentIsAdmin: boolean) => {
    updateUserRoleMutation.mutate({ userId, isAdmin: !currentIsAdmin });
  };

  const filteredUsers = (users as any[]).filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, moderate content, and configure platform settings
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center space-x-2">
              <Flag className="h-4 w-4" />
              <span>Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{(adminStats as any)?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{(adminStats as any)?.totalPlants || 0}</p>
                  <p className="text-sm text-muted-foreground">Plants in Database</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{(adminStats as any)?.totalContributions || 0}</p>
                  <p className="text-sm text-muted-foreground">Contributions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Flag className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{(pendingContributions as any[]).length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Contributions */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(pendingContributions as any[]).length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No pending contributions
                      </p>
                    ) : (
                      (pendingContributions as any[]).map((contribution: any) => (
                        <div key={contribution.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{contribution.plantName}</h3>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            By: {contribution.contributorName}
                          </p>
                          <p className="text-sm">{contribution.description}</p>
                          <div className="flex space-x-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleModerateContent(contribution.id, 'approve', 'contribution')}
                              disabled={moderateContentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleModerateContent(contribution.id, 'reject', 'contribution')}
                              disabled={moderateContentMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reported Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Reported Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(reportedContent as any[]).length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No reported content
                      </p>
                    ) : (
                      (reportedContent as any[]).map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Report #{report.id}</h3>
                            <Badge variant="destructive">Reported</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reason: {report.reason}
                          </p>
                          <p className="text-sm">{report.description}</p>
                          <div className="flex space-x-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleModerateContent(report.id, 'approve', 'report')}
                              disabled={moderateContentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleModerateContent(report.id, 'reject', 'report')}
                              disabled={moderateContentMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Take Action
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.contributionCount || 0} contributions
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant={user.isAdmin ? 'destructive' : 'default'}
                          onClick={() => handleToggleAdminRole(user.id, user.isAdmin)}
                          disabled={updateUserRoleMutation.isPending || user.id === user.id}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp">
            <WhatsAppIntegration />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">General Settings</h3>
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input id="site-name" defaultValue="MediPlant AI" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-uploads">Max Daily Uploads per User</Label>
                      <Input id="max-uploads" type="number" defaultValue="10" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">AI Configuration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ai-confidence">Minimum AI Confidence Threshold</Label>
                      <Input id="ai-confidence" type="number" step="0.1" defaultValue="0.8" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto-approve">Auto-approve High Confidence Identifications</Label>
                      <select className="w-full p-2 border rounded" defaultValue="true">
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Moderation Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="auto-moderate">Automatic Content Moderation</Label>
                    <Textarea 
                      id="auto-moderate" 
                      placeholder="Configure automatic moderation rules..."
                      className="min-h-20"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}