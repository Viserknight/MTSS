import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Inbox, Mail, MailOpen, Plus } from "lucide-react";
import { format } from "date-fns";

interface UserData {
  id: string;
  full_name: string;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: ""
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchMessages()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    // Get all teachers and parents
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["teacher", "parent"]);

    if (rolesData) {
      const userIds = rolesData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const roleMap = new Map(rolesData.map(r => [r.user_id, r.role]));
      const usersWithRoles = (profiles || [])
        .filter(p => p.id !== user!.id)
        .map(p => ({
          id: p.id,
          full_name: p.full_name,
          role: roleMap.get(p.id) || "unknown"
        }));

      setUsers(usersWithRoles);
    }
  };

  const fetchMessages = async () => {
    const [inboxRes, sentRes] = await Promise.all([
      supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false })
    ]);

    const allUserIds = new Set<string>();
    (inboxRes.data || []).forEach(m => { allUserIds.add(m.sender_id); allUserIds.add(m.recipient_id); });
    (sentRes.data || []).forEach(m => { allUserIds.add(m.sender_id); allUserIds.add(m.recipient_id); });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(allUserIds));

    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    const enrichedInbox = (inboxRes.data || []).map(m => ({
      ...m,
      sender_name: profileMap.get(m.sender_id) || "Unknown",
      recipient_name: profileMap.get(m.recipient_id) || "Unknown"
    }));

    const enrichedSent = (sentRes.data || []).map(m => ({
      ...m,
      sender_name: profileMap.get(m.sender_id) || "Unknown",
      recipient_name: profileMap.get(m.recipient_id) || "Unknown"
    }));

    setInbox(enrichedInbox);
    setSent(enrichedSent);
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user!.id,
      recipient_id: newMessage.recipient_id,
      subject: newMessage.subject,
      content: newMessage.content
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    } else {
      toast.success("Message sent successfully");
      setIsDialogOpen(false);
      setNewMessage({ recipient_id: "", subject: "", content: "" });
      fetchMessages();
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("id", messageId);
    fetchMessages();
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === user!.id) {
      handleMarkAsRead(message.id);
    }
  };

  const unreadCount = inbox.filter(m => !m.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Communicate with teachers and parents
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
                <DialogDescription>
                  Send a message to a teacher or parent
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Select value={newMessage.recipient_id} onValueChange={(v) => setNewMessage({ ...newMessage, recipient_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input 
                    placeholder="Message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea 
                    placeholder="Type your message..."
                    rows={5}
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Messages List */}
          <Card>
            <Tabs defaultValue="inbox">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inbox" className="relative">
                    <Inbox className="h-4 w-4 mr-2" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent">
                    <Send className="h-4 w-4 mr-2" />
                    Sent
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="inbox" className="m-0">
                  {inbox.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No messages in your inbox</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {inbox.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            message.is_read ? "bg-background" : "bg-primary/5 border-primary/20"
                          } ${selectedMessage?.id === message.id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {message.is_read ? (
                                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Mail className="h-4 w-4 text-primary" />
                                )}
                                <span className="font-medium truncate">{message.sender_name}</span>
                              </div>
                              <p className="text-sm font-medium truncate mt-1">{message.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), "PPp")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="sent" className="m-0">
                  {sent.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No sent messages</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {sent.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMessage?.id === message.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">To: {message.recipient_name}</span>
                              </div>
                              <p className="text-sm font-medium truncate mt-1">{message.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), "PPp")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Message Viewer */}
          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{selectedMessage.sender_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{selectedMessage.recipient_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedMessage.created_at), "PPpp")}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Message</p>
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select a message to view</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
