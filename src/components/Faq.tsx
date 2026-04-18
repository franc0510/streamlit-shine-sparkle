import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment sont générées les prédictions sur PredictEsport ?",
    a: "Contrairement aux sites basés sur des avis subjectifs, nos prédictions sont générées par un moteur d'intelligence artificielle avancé. Nous utilisons des modèles de Machine Learning (LightGBM, Voting Ensemble) entraînés sur 10 ans de données compétitives (KDA, GPM, vision, drafts, winrates par patch). Notre algorithme traite des milliers de variables en temps réel pour calculer des probabilités de victoire objectives et basées sur la donnée.",
  },
  {
    q: "Sur quelles compétitions LoL proposez-vous des pronostics ?",
    a: "Nous couvrons l'élite mondiale de League of Legends. Nos analyses algorithmiques incluent les ligues majeures (LEC, LCK, LPL, LCS) ainsi que les leagues mineures (LFL, Arabian, etc.) et les tournois internationaux (Worlds, MSI). Notre modèle est capable de s'adapter aux spécificités de chaque région.",
  },
  {
    q: "Vos prédictions garantissent-elles des gains ?",
    a: "Non. Les paris esportifs comportent toujours une part d'aléa (le « facteur humain »). PredictEsport fournit une aide à la décision basée sur des probabilités statistiques pour maximiser votre Expected Value (EV) sur le long terme. Nous vous recommandons de toujours parier de manière responsable.",
  },
  {
    q: "Quelle est la différence entre un pronostic et une prédiction par IA ?",
    a: "Un pronostic classique est souvent l'avis d'une personne. Une prédiction PredictEsport est le résultat d'un calcul mathématique de probabilités. Notre modèle quantifie l'incertitude et identifie les value bets (cotes sous-évaluées par les bookmakers) plutôt que de simplement deviner le vainqueur.",
  },
];

export const Faq = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mt-16 mb-8" id="faq">
      <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2 text-center">
        Questions fréquentes sur l'IA et les prédictions esport
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Tout ce qu'il faut savoir sur notre algorithme de Machine Learning, les compétitions LoL couvertes et notre approche value bet.
      </p>

      <div className="max-w-3xl mx-auto bg-gradient-card border border-border/50 rounded-xl p-4 sm:p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
};
