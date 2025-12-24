'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { agroConsultantChatbot } from '@/ai/flows/agro-consultant-chatbot';
import { CardSpotlight } from './ui/card-spotlight';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your Agro-Consultant. How can I help you with your farming questions today?",
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages;
      const result = await agroConsultantChatbot({ query: input, chatHistory });
      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Bot />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] shadow-2xl flex flex-col"
          >
            <CardSpotlight className="h-full w-full flex flex-col p-0">
                <div className="p-4 border-b border-primary/20">
                <h3 className="font-headline text-lg font-semibold text-center">Agro-Consultant</h3>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : ''
                        }`}
                    >
                        {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8">
                            <AvatarFallback><Bot size={20}/></AvatarFallback>
                        </Avatar>
                        )}
                        <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                            message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                        >
                        <p className="text-sm">{message.content}</p>
                        </div>
                    </div>
                    ))}
                    {loading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback><Bot size={20}/></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs rounded-lg px-4 py-2 bg-secondary flex items-center">
                            <Loader className="w-4 h-4 animate-spin"/>
                        </div>
                        </div>
                    )}
                </div>
                </ScrollArea>

                <div className="p-4 border-t border-primary/20">
                <div className="flex items-center gap-2">
                    <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question..."
                    disabled={loading}
                    className="!bg-background/50"
                    />
                    <Button size="icon" onClick={handleSend} disabled={loading}>
                    <Send />
                    </Button>
                </div>
                </div>
            </CardSpotlight>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
