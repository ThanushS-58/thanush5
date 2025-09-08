import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MessageSquare, Mic, Send, Settings, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/language-context';

interface CommunicationSettings {
  twilioEnabled: boolean;
  phoneNumber: string;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  emergencyContacts: string[];
}

export default function CommunicationPanel() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: communicationSettings } = useQuery({
    queryKey: ['/api/communication/settings'],
  });

  const { data: callHistory = [] } = useQuery({
    queryKey: ['/api/communication/history'],
  });

  const sendSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string; type: 'sms' | 'voice' }) => {
      return apiRequest('POST', '/api/communication/send', data);
    },
    onSuccess: (data, variables) => {
      toast({
        title: `${variables.type === 'sms' ? 'SMS' : 'Voice Call'} Sent`,
        description: `Successfully sent to ${variables.phoneNumber}`,
      });
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/communication'] });
    },
    onError: () => {
      toast({
        title: 'Failed to Send',
        description: 'Please check your phone number and try again.',
        variant: 'destructive',
      });
    },
  });

  const configureSettingsMutation = useMutation({
    mutationFn: async (data: Partial<CommunicationSettings>) => {
      return apiRequest('POST', '/api/communication/configure', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Communication settings have been configured successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/communication'] });
    },
  });

  const handleSendSMS = () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both phone number and message.',
        variant: 'destructive',
      });
      return;
    }
    sendSMSMutation.mutate({ phoneNumber, message, type: 'sms' });
  };

  const handleVoiceCall = () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both phone number and message content.',
        variant: 'destructive',
      });
      return;
    }
    sendSMSMutation.mutate({ phoneNumber, message, type: 'voice' });
  };

  const addEmergencyContact = () => {
    if (!emergencyContact) return;
    
    const currentContacts = (communicationSettings as any)?.emergencyContacts || [];
    configureSettingsMutation.mutate({
      emergencyContacts: [...currentContacts, emergencyContact]
    });
    setEmergencyContact('');
  };

  return (
    <div className="space-y-6" data-testid="communication-panel">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Communication Center</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Send SMS notifications and make voice calls to share plant information and emergency medicinal knowledge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message/Call */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Send Communication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-phone">Recipient Phone Number</Label>
              <Input
                id="recipient-phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="recipient-phone-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-content">Message Content</Label>
              <Textarea
                id="message-content"
                placeholder="Enter your message about plant identification or medicinal uses..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                data-testid="message-content-input"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSendSMS}
                disabled={sendSMSMutation.isPending}
                className="flex-1"
                data-testid="send-sms-button"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {sendSMSMutation.isPending ? 'Sending...' : 'Send SMS'}
              </Button>
              
              <Button
                onClick={handleVoiceCall}
                disabled={sendSMSMutation.isPending}
                variant="outline"
                className="flex-1"
                data-testid="make-call-button"
              >
                <Phone className="h-4 w-4 mr-2" />
                {sendSMSMutation.isPending ? 'Calling...' : 'Voice Call'}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">Quick Templates:</p>
              <div className="space-y-1">
                <button 
                  className="block text-left hover:text-foreground transition-colors"
                  onClick={() => setMessage("I've identified a medicinal plant that might help with your condition. Here are the details...")}
                >
                  • Plant identification result
                </button>
                <button 
                  className="block text-left hover:text-foreground transition-colors"
                  onClick={() => setMessage("Important: This plant requires careful preparation. Please consult a healthcare provider before use.")}
                >
                  • Safety warning
                </button>
                <button 
                  className="block text-left hover:text-foreground transition-colors"
                  onClick={() => setMessage("Emergency plant identification needed. Please respond with plant photo and current symptoms.")}
                >
                  • Emergency consultation
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Communication Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Service Status</h3>
              <div className="flex items-center justify-between">
                <span>SMS Service</span>
                <Badge variant={(communicationSettings as any)?.smsEnabled ? 'default' : 'secondary'}>
                  {(communicationSettings as any)?.smsEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Voice Calls</span>
                <Badge variant={(communicationSettings as any)?.voiceEnabled ? 'default' : 'secondary'}>
                  {(communicationSettings as any)?.voiceEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold">Emergency Contacts</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add emergency contact..."
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={addEmergencyContact}
                  size="icon"
                  disabled={!emergencyContact}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {((communicationSettings as any)?.emergencyContacts || []).map((contact: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{contact}</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      const contacts = (communicationSettings as any)?.emergencyContacts.filter((_: any, i: number) => i !== index);
                      configureSettingsMutation.mutate({ emergencyContacts: contacts });
                    }}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Regional Settings</Label>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  SMS rates and availability vary by region
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Recent Communications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {(callHistory as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No communications sent yet.</p>
                <p className="text-sm mt-2">Start sharing plant knowledge via SMS or voice calls!</p>
              </div>
            ) : (
              (callHistory as any[]).map((communication: any) => (
                <div key={communication.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {communication.type === 'sms' ? (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Phone className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">{communication.recipient}</span>
                      <Badge variant="outline" className="text-xs">
                        {communication.type.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(communication.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground">{communication.message}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={communication.status === 'delivered' ? 'default' : 'secondary'}>
                      {communication.status}
                    </Badge>
                    {communication.plantReference && (
                      <Badge variant="outline">
                        Plant: {communication.plantReference}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Communication Features Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">SMS Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Send plant identification results, safety warnings, and preparation instructions directly to users' phones.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Voice Calls</h3>
              <p className="text-sm text-muted-foreground">
                Make voice calls for urgent consultations and detailed explanations of medicinal plant usage.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Emergency Network</h3>
              <p className="text-sm text-muted-foreground">
                Maintain emergency contacts for rapid response to poisoning cases and urgent plant identification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}