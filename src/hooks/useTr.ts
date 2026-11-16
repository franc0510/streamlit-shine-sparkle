import { useTranslation } from "react-i18next";

/** Texte bilingue : français pour `fr`, anglais pour toutes les autres langues. */
export const useTr = () => {
  const { i18n } = useTranslation();
  const lng = (i18n.language || "en").slice(0, 2);
  const tr = (fr: string, en: string) => (lng === "fr" ? fr : en);
  return { tr, lng: lng === "fr" ? "fr-FR" : "en-GB", isFr: lng === "fr" };
};
