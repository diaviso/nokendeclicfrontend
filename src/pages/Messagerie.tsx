import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService } from "@/services/messagingService";
import type { Conversation, PrivateMessage, UserInfo } from "@/services/messagingService";
import { Button, Input, Card, AlertModal } from "@/components/ui";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  Users,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  X,
  Shield,
  Smile,
  Pencil,
  MoreVertical,
} from "lucide-react";

export function Messagerie() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [contacts, setContacts] = useState<UserInfo[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<PrivateMessage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageMenuId, setMessageMenuId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: "success", title: "", message: "" });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await messagingService.getMessages(conversationId);
      setMessages(data);
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const data = await messagingService.getContactableUsers();
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      setShowEmojiPicker(false);
      const message = await messagingService.sendMessage(selectedConversation.id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Update last message in conversations list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'envoyer le message. Réessayez.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage(prev => prev + emoji.native);
    inputRef.current?.focus();
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editContent.trim()) return;
    
    try {
      const updated = await messagingService.updateMessage(messageId, editContent.trim());
      setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
      setEditingMessage(null);
      setEditContent("");
      setMessageMenuId(null);
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier le message.",
      });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messagingService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setMessageMenuId(null);
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de supprimer le message.",
      });
    }
  };

  const startEditMessage = (message: PrivateMessage) => {
    setEditingMessage(message);
    setEditContent(message.content);
    setMessageMenuId(null);
  };

  const handleStartConversation = async (contact: UserInfo) => {
    try {
      const result = await messagingService.startConversation(contact.id);
      
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.id === result.id);
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        const newConv: Conversation = {
          id: result.id,
          otherUser: result.otherUser,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
      }
      
      setShowNewConversation(false);
      setShowMobileChat(true);
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de démarrer la conversation.",
      });
    }
  };

  const handleDeleteConversation = (conv: Conversation) => {
    setModal({
      isOpen: true,
      type: "warning",
      title: "Supprimer la conversation",
      message: `Êtes-vous sûr de vouloir supprimer cette conversation avec ${getUserDisplayName(conv.otherUser)} ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await messagingService.deleteConversation(conv.id);
          setConversations(prev => prev.filter(c => c.id !== conv.id));
          if (selectedConversation?.id === conv.id) {
            setSelectedConversation(null);
            setMessages([]);
          }
          setModal({ ...modal, isOpen: false });
        } catch (error) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de supprimer la conversation.",
          });
        }
      },
    });
  };

  const getUserDisplayName = (userInfo: UserInfo) => {
    if (userInfo.firstName || userInfo.lastName) {
      return `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
    }
    return userInfo.username;
  };

  const getUserInitials = (userInfo: UserInfo) => {
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName[0]}${userInfo.lastName[0]}`.toUpperCase();
    }
    return userInfo.username.slice(0, 2).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    getUserDisplayName(conv.otherUser).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    getUserDisplayName(contact).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messagerie</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setShowNewConversation(true);
            loadContacts();
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle discussion</span>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r bg-gray-50 dark:bg-gray-900 flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-100 dark:bg-gray-700 border-0"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 p-4">
                <Users className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-center">
                  {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setShowNewConversation(true);
                    loadContacts();
                  }}
                >
                  Démarrer une discussion
                </Button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800 transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-white dark:bg-gray-800 border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileChat(true);
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {conv.otherUser.pictureUrl ? (
                      <img
                        src={conv.otherUser.pictureUrl}
                        alt={getUserDisplayName(conv.otherUser)}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-semibold">
                        {getUserInitials(conv.otherUser)}
                      </div>
                    )}
                    {conv.otherUser.role === "ADMIN" && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Shield className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {getUserDisplayName(conv.otherUser)}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.senderId === user?.id && (
                              <span className="text-gray-400 mr-1">Vous:</span>
                            )}
                            {conv.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic">Nouvelle conversation</span>
                        )}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-gray-800 ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-gray-800">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                
                {selectedConversation.otherUser.pictureUrl ? (
                  <img
                    src={selectedConversation.otherUser.pictureUrl}
                    alt={getUserDisplayName(selectedConversation.otherUser)}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-semibold">
                    {getUserInitials(selectedConversation.otherUser)}
                  </div>
                )}
                
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {getUserDisplayName(selectedConversation.otherUser)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {selectedConversation.otherUser.role === "ADMIN" ? (
                      <>
                        <Shield className="h-3 w-3 text-amber-500" />
                        Administrateur
                      </>
                    ) : (
                      "Membre"
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteConversation(selectedConversation)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Aucun message</p>
                    <p className="text-sm">Envoyez le premier message !</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.senderId === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                    const isEditing = editingMessage?.id === message.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        {!isOwn && showAvatar ? (
                          message.sender.pictureUrl ? (
                            <img
                              src={message.sender.pictureUrl}
                              alt={getUserDisplayName(message.sender)}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                              {getUserInitials(message.sender)}
                            </div>
                          )
                        ) : (
                          <div className="w-8" />
                        )}
                        
                        <div className={`relative max-w-[70%] ${isOwn ? "flex flex-row-reverse items-center gap-2" : "flex items-center gap-2"}`}>
                          {/* Message actions for own messages */}
                          {isOwn && !isEditing && (
                            <div className="relative">
                              <button
                                onClick={() => setMessageMenuId(messageMenuId === message.id ? null : message.id)}
                                className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </button>
                              {messageMenuId === message.id && (
                                <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10 min-w-32">
                                  <button
                                    onClick={() => startEditMessage(message)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="bg-white/20 rounded px-2 py-1 text-sm outline-none"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => { setEditingMessage(null); setEditContent(""); }}
                                    className="text-xs px-2 py-1 rounded hover:bg-white/20"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => handleEditMessage(message.id)}
                                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                                  >
                                    Sauvegarder
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? "text-white/70 justify-end" : "text-gray-400"}`}>
                              <Clock className="h-3 w-3" />
                              {formatTime(message.createdAt)}
                              {isOwn && (
                                message.isRead ? (
                                  <CheckCheck className="h-3 w-3 ml-1" />
                                ) : (
                                  <Check className="h-3 w-3 ml-1" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Smile className="h-5 w-5 text-gray-500" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          locale="fr"
                          previewPosition="none"
                          skinTonePosition="none"
                        />
                      </div>
                    )}
                  </div>
                  <Input
                    ref={inputRef}
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={sendingMessage}
                    onFocus={() => setShowEmojiPicker(false)}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
              <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
                <MessageSquare className="h-12 w-12 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bienvenue dans la messagerie
              </h2>
              <p className="text-center max-w-md mb-6">
                Sélectionnez une conversation existante ou démarrez une nouvelle discussion avec un administrateur.
              </p>
              <Button
                onClick={() => {
                  setShowNewConversation(true);
                  loadContacts();
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle discussion
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nouvelle discussion</h2>
              <button
                onClick={() => setShowNewConversation(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 p-4">
                  <User className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-center">
                    {searchQuery ? "Aucun contact trouvé" : "Aucun contact disponible"}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                    onClick={() => handleStartConversation(contact)}
                  >
                    {contact.pictureUrl ? (
                      <img
                        src={contact.pictureUrl}
                        alt={getUserDisplayName(contact)}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-semibold">
                        {getUserInitials(contact)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {getUserDisplayName(contact)}
                        </span>
                        {contact.role === "ADMIN" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{contact.username}
                      </p>
                    </div>
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
