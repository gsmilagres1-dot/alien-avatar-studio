// Quiz 3 — Cinema & Séries: alienígenas, espaço, ficção científica, viagens no tempo.
// Livre para todos os singulares — sem prêmios, sem selos, apenas certo/errado + refazer.

export interface CinemaQuestion {
  q: string;
  options: string[];
  answer: number; // índice correto
}

export interface CinemaTitle {
  id: string;
  title: string;
  emoji: string;
  category: "aliens" | "espaço" | "tempo" | "fantasia" | "animação";
  tagline: string;
  questions: CinemaQuestion[]; // 5
}

export const CINEMA_TITLES: CinemaTitle[] = [
  {
    id: "star-wars",
    title: "Star Wars",
    emoji: "🗡️",
    category: "espaço",
    tagline: "Faz muito tempo, numa galáxia distante… onde ninguém aprende a mirar.",
    questions: [
      { q: "Quem é o pai do Luke (spoiler antigo, relaxa)?", options: ["Darth Vader",: "Han Solo", "Yoda", "Chewbacca"].filter(Boolean) as string[], answer: 0 },
      { q: "Como se chama a arma preferida dos Jedi?", options: ["Sabre de luz", "Blaster", "Foice quântica", "Chinelo da Força"], answer: 0 },
      { q: "Qual é o planeta desértico do Luke?", options: ["Tatooine", "Naboo", "Hoth", "Endor"], answer: 0 },
      { q: "Yoda fala esquisito porque…", options: ["Ordem invertida das frases usa ele", "Está resfriado", "É tradução automática", "Idade avançada zoou o dublador"], answer: 0 },
      { q: "Chewbacca é um…", options: ["Wookiee", "Ewok", "Sith", "Cachorro grande da NASA"], answer: 0 },
    ],
  },
];
