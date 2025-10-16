import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, User } from "lucide-react";

const games = [
  { id: "lol", name: "League of Legends", path: "/", active: true },
  { id: "cs2", name: "CS2", path: "/cs2", active: false },
  { id: "dota2", name: "DOTA 2", path: "/dota2", active: false },
];

export const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Gamepad2 className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
            <span className="font-display text-2xl font-bold bg-gradient-gaming bg-clip-text text-transparent">
              PredicteSport
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {games.map((game) => (
                <Link
                  key={game.id}
                  to={game.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === game.path
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : game.active
                      ? "text-foreground hover:bg-secondary"
                      : "text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                  onClick={(e) => !game.active && e.preventDefault()}
                >
                  {game.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/about">
                <Button variant="ghost" size="sm">
                  À propos
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  Connexion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
