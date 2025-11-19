/**
 * MESSAGING DIALOG
 * 
 * Real-time chat interface for direct communication between buyers and sellers.
 * Enables transaction coordination, questions about listings, and delivery arrangements.
 * 
 * KEY FEATURES:
 * 1. Real-time messaging using Supabase Realtime
 * 2. Instant message delivery and read receipts
 * 3. Conversation persistence (messages stored in database)
 * 4. Push notifications for new messages
 * 5. Auto-scroll to latest message
 * 6. Read status tracking and updates
 * 
 * CONVERSATION FLOW:
 * 1. Buyer clicks "Contact Seller" on a listing OR clicks message icon in order card
 * 2. Dialog opens with existing conversation history (if any)
 * 3. Messages load from database, sorted chronologically
 * 4. Real-time subscription established for new messages
 * 5. User types and sends message
 * 6. Message instantly appears in both users' chats (via Realtime)
 * 7. Recipient receives push notification
 * 8. Read status automatically updated when message viewed
 * 
 * CONVERSATION ID:
 * - Generated from sorted user IDs: [user1, user2].sort().join("-")
 * - Ensures same conversation ID regardless of who initiates
 * - Example: "abc123-def456" for users abc123 and def456
 * 
 * REALTIME INTEGRATION:
 * - Uses Supabase Realtime for instant message delivery
 * - Channel: `messages-{conversationId}`
 * - Listens for: INSERT events on messages table
 * - Auto-marks messages as read when received by current user
 * 
 * DATABASE INTEGRATION:
 * - Fetches from: messages table filtered by conversation_id
 * - Inserts to: messages table with sender/recipient/content
 * - Updates: read status when messages viewed
 */

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createNotification, NotificationTemplates } from "@/utils/notificationHelpers";

/**
 * Message Interface
 * Represents a single message in the conversation
 */
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string; // Optional, enriched for display
}

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string; // ID of person we're chatting with
  otherUserName: string; // Display name of other person
  listingId?: string; // Optional listing context
}

export const MessagingDialog = ({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
  listingId,
}: MessagingDialogProps) => {
  // MESSAGE STATE
  const [messages, setMessages] = useState<Message[]>([]); // Conversation history
  const [newMessage, setNewMessage] = useState(""); // Current message being typed
  const [loading, setLoading] = useState(false); // Initial message fetch
  const [sending, setSending] = useState(false); // Sending message in progress
  const [currentUserId, setCurrentUserId] = useState<string>(""); // Authenticated user ID
  
  // SCROLL REFERENCE - Used to auto-scroll to latest message
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * CONVERSATION ID
   * Deterministic ID for the conversation between two users
   * 
   * FORMAT: "userId1-userId2" where IDs are alphabetically sorted
   * ENSURES: Same conversation ID regardless of who initiates chat
   * EXAMPLE: User A (abc) and User B (xyz) → "abc-xyz"
   */
  const conversationId = [currentUserId, otherUserId].sort().join("-");

  useEffect(() => {
    if (open) {
      initializeChat();
    }
  }, [open]);

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);
      await fetchMessages();
      setupRealtimeSubscription();
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mark messages as read
      const unreadIds = data
        ?.filter(m => m.recipient_id === currentUserId && !m.read)
        .map(m => m.id) || [];

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadIds);
      }

      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();

          // Mark as read if it's for current user
          if (payload.new.recipient_id === currentUserId) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", payload.new.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: otherUserId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      
      // Create notification for recipient
      const notification = NotificationTemplates.newMessage(otherUserName);
      
      await createNotification({
        userId: otherUserId,
        ...notification,
        data: { conversation_id: conversationId, listing_id: listingId },
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {otherUserName}</DialogTitle>
          <DialogDescription>
            Discuss details about the listing
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {(isOwn ? "You" : otherUserName)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col gap-1 max-w-[70%] ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};