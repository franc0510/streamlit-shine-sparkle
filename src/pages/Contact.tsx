import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });
    
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-gaming bg-clip-text text-transparent">
              Contactez-nous
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une question ? Une suggestion ? N'hésitez pas à nous contacter, nous sommes là pour vous aider !
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-gradient-card border-border/50 text-center hover:border-primary/50 transition-all animate-slide-up">
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">contact@predictesport.com</p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 text-center hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <MessageSquare className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Support</h3>
              <p className="text-sm text-muted-foreground">Réponse sous 24h</p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 text-center hover:border-primary/50 transition-all animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Send className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display font-bold mb-2">Réseaux</h3>
              <p className="text-sm text-muted-foreground">Suivez-nous en ligne</p>
            </Card>
          </div>

          <Card className="p-8 bg-gradient-card border-border/50 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Votre message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="bg-background/50 border-border/50 focus:border-primary resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                <Send className="w-4 h-4" />
                Envoyer le message
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 PredicteSport. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
