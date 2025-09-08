import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Phone, Image, Send, Settings, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';

interface WhatsAppMessage {
  id: string;
  from: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  response?: string;
  plantIdentified?: boolean;
}

export default function WhatsAppIntegration() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isIntegrationActive, setIsIntegrationActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: whatsappMessages = [] } = useQuery({
    queryKey: ['/api/whatsapp/messages'],
    enabled: isIntegrationActive,
  });

  const { data: integrationStats } = useQuery({
    queryKey: ['/api/whatsapp/stats'],
  });

  const activateIntegrationMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string }) => {
      return apiRequest('POST', '/api/whatsapp/activate', data);
    },
    onSuccess: () => {
      setIsIntegrationActive(true);
      toast({
        title: 'WhatsApp Integration Activated',
        description: 'Your WhatsApp bot is now ready to identify plants!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp'] });
    },
    onError: () => {
      toast({
        title: 'Activation Failed',
        description: 'Please check your WhatsApp Business API credentials.',
        variant: 'destructive',
      });
    },
  });

  const sendTestMessageMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      return apiRequest('POST', '/api/whatsapp/test-message', data);
    },
    onSuccess: () => {
      toast({
        title: 'Test Message Sent',
        description: 'Check your WhatsApp for the test message.',
      });
      setTestMessage('');
    },
    onError: () => {
      toast({
        title: 'Failed to Send',
        description: 'Please check your phone number and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleActivateIntegration = () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your WhatsApp Business phone number.',
        variant: 'destructive',
      });
      return;
    }
    activateIntegrationMutation.mutate({ phoneNumber });
  };

  const handleSendTestMessage = () => {
    if (!testMessage || !phoneNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both phone number and test message.',
        variant: 'destructive',
      });
      return;
    }
    sendTestMessageMutation.mutate({ phoneNumber, message: testMessage });
  };

  return (
    <div className="space-y-6" data-testid="whatsapp-integration">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Plant Identification</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enable WhatsApp integration to let users identify plants by simply sending photos through WhatsApp.
          Our AI bot will respond with plant information and medicinal uses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Integration Setup</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">WhatsApp Business Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="whatsapp-phone-input"
              />
              <p className="text-xs text-muted-foreground">
                Enter your verified WhatsApp Business API phone number
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={isIntegrationActive ? 'default' : 'secondary'}>
                {isIntegrationActive ? 'Active' : 'Inactive'}
              </Badge>
              {isIntegrationActive && (
                <Badge variant="outline" className="text-green-600">
                  <Bot className="h-3 w-3 mr-1" />
                  Bot Online
                </Badge>
              )}
            </div>

            <Button
              onClick={handleActivateIntegration}
              disabled={activateIntegrationMutation.isPending || isIntegrationActive}
              className="w-full"
              data-testid="activate-whatsapp-button"
            >
              {activateIntegrationMutation.isPending ? (
                'Activating...'
              ) : isIntegrationActive ? (
                'Integration Active'
              ) : (
                'Activate WhatsApp Bot'
              )}
            </Button>

            {isIntegrationActive && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="test-message">Send Test Message</Label>
                  <div className="flex space-x-2">
                    <Textarea
                      id="test-message"
                      placeholder="Type a test message to send via WhatsApp..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="flex-1"
                      rows={2}
                      data-testid="test-message-input"
                    />
                    <Button
                      onClick={handleSendTestMessage}
                      disabled={sendTestMessageMutation.isPending}
                      size="icon"
                      className="self-end"
                      data-testid="send-test-message-button"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Integration Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Usage Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {(integrationStats as any)?.messagesReceived || 0}
                </p>
                <p className="text-sm text-muted-foreground">Messages Received</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {(integrationStats as any)?.plantsIdentified || 0}
                </p>
                <p className="text-sm text-muted-foreground">Plants Identified</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {(integrationStats as any)?.activeUsers || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {(integrationStats as any)?.responseTime || '< 1s'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      {isIntegrationActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Recent WhatsApp Messages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(whatsappMessages as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Share your WhatsApp number to start receiving plant identification requests!</p>
                  <p className="text-sm mt-2">Users can send: "Hi, can you help identify this plant?" with a photo</p>
                </div>
              ) : (
                (whatsappMessages as any[]).map((message: WhatsAppMessage) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{message.from}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground">{message.message}</p>
                    
                    {message.imageUrl && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Image className="h-4 w-4" />
                        <span>Image attached</span>
                      </div>
                    )}
                    
                    {message.response && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">Bot Response:</span> {message.response}
                        </p>
                        {message.plantIdentified && (
                          <Badge variant="default" className="mt-2">
                            Plant Identified
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How WhatsApp Integration Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">User Sends Photo</h3>
              <p className="text-sm text-muted-foreground">
                Users send plant photos to your WhatsApp Business number with a question like "What plant is this?"
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Identifies Plant</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes the image and matches it against our medicinal plant database for identification.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Instant Response</h3>
              <p className="text-sm text-muted-foreground">
                Bot responds with plant name, medicinal uses, preparation methods, and safety information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}