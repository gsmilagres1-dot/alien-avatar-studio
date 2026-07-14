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
      { q: "Quem é o pai do Luke Skywalker (spoiler antigão, relaxa)?", options: ["Darth Vader", "Han Solo", "Yoda", "Chewbacca"], answer: 0 },
      { q: "Qual é a arma preferida dos Jedi?", options: ["Sabre de luz", "Blaster", "Foice quântica", "Chinelo da Força"], answer: 0 },
      { q: "Em qual planeta desértico o Luke foi criado?", options: ["Tatooine", "Naboo", "Hoth", "Endor"], answer: 0 },
      { q: "Por que o Yoda fala esquisito?", options: ["Ordem invertida ele usa", "Está resfriado", "É tradução automática", "Bateu a cabeça no X-Wing"], answer: 0 },
      { q: "Chewbacca é um…", options: ["Wookiee", "Ewok", "Sith", "Cachorro grande da NASA"], answer: 0 },
    ],
  },
  {
    id: "star-trek",
    title: "Star Trek",
    emoji: "🖖",
    category: "espaço",
    tagline: "Vida longa e próspera — e um capitão que nunca fica na cadeira.",
    questions: [
      { q: "Como se chama a nave do Capitão Kirk?", options: ["USS Enterprise", "Millennium Falcon", "Serenity", "Rocinante"], answer: 0 },
      { q: "Spock é meio humano, meio…", options: ["Vulcano", "Klingon", "Romulano", "Ferengi"], answer: 0 },
      { q: "Qual é a saudação vulcana?", options: ["Vida longa e próspera", "Que a Força esteja com você", "Nanu nanu", "Boa noite"], answer: 0 },
      { q: "O que o transporter faz?", options: ["Desmonta e remonta você", "Faz café", "Vira invisível", "Traduz alienês"], answer: 0 },
      { q: "Quem manda dizer 'engage'?", options: ["Capitão Picard", "Han Solo", "Neo", "ET"], answer: 0 },
    ],
  },
  {
    id: "et",
    title: "E.T. — O Extraterrestre",
    emoji: "👽",
    category: "aliens",
    tagline: "E.T. telefone… casa. Roaming interplanetário sai caro.",
    questions: [
      { q: "Qual doce o E.T. adora?", options: ["Reese's Pieces", "Halls", "Sonho de Valsa", "Skittles"], answer: 0 },
      { q: "O E.T. voa junto do Elliott em cima de qual veículo?", options: ["Bicicleta", "Skate", "Patins", "Fusca"], answer: 0 },
      { q: "Frase famosa do E.T.?", options: ["E.T. telefone, casa", "Yippee-ki-yay", "Hasta la vista", "I'll be back"], answer: 0 },
      { q: "Quem dirigiu o filme?", options: ["Steven Spielberg", "George Lucas", "James Cameron", "Ridley Scott"], answer: 0 },
      { q: "Como o E.T. cura ferimentos?", options: ["Dedo brilhante", "Cospe", "Chora", "Pede reembolso"], answer: 0 },
    ],
  },
  {
    id: "avatar",
    title: "Avatar",
    emoji: "🌿",
    category: "aliens",
    tagline: "Ficamos azuis de tanto esperar o Cameron terminar as sequências.",
    questions: [
      { q: "Qual é o nome do planeta/lua de Avatar?", options: ["Pandora", "Krypton", "Arrakis", "LV-426"], answer: 0 },
      { q: "Como se chama a raça alienígena?", options: ["Na'vi", "Vulcanos", "Klingons", "Ewoks"], answer: 0 },
      { q: "Que mineral cobiçado os humanos querem?", options: ["Unobtainium", "Kryptonita", "Especiaria", "Vibranium"], answer: 0 },
      { q: "Quem dirigiu Avatar?", options: ["James Cameron", "Peter Jackson", "Denis Villeneuve", "Zack Snyder"], answer: 0 },
      { q: "A conexão dos Na'vi com animais é feita por…", options: ["Trança neural", "Bluetooth", "Wi-Fi 6", "Grito alto"], answer: 0 },
    ],
  },
  {
    id: "interstellar",
    title: "Interestelar",
    emoji: "🕳️",
    category: "espaço",
    tagline: "Uma hora aqui, sete anos lá. Igual reunião de trabalho.",
    questions: [
      { q: "Quem dirigiu Interestelar?", options: ["Christopher Nolan", "James Cameron", "Ridley Scott", "Denis Villeneuve"], answer: 0 },
      { q: "O planeta com ondas gigantes é conhecido como planeta de…", options: ["Miller", "Mann", "Edmunds", "Cooper"], answer: 0 },
      { q: "Cooper mergulha em qual buraco negro?", options: ["Gargantua", "Sagitário A*", "M87", "Cygnus X-1"], answer: 0 },
      { q: "Quem cuida da Murph adulta?", options: ["Jessica Chastain", "Anne Hathaway", "Zendaya", "Emma Stone"], answer: 0 },
      { q: "TARS é um…", options: ["Robô blocado", "Alien", "Cachorro", "Piloto humano"], answer: 0 },
    ],
  },
  {
    id: "2001",
    title: "2001 — Uma Odisseia no Espaço",
    emoji: "🪨",
    category: "espaço",
    tagline: "Um monolito preto, um HAL passivo-agressivo e muito silêncio.",
    questions: [
      { q: "Qual é o nome da IA da nave?", options: ["HAL 9000", "Skynet", "GLaDOS", "Jarvis"], answer: 0 },
      { q: "Que objeto misterioso aparece no filme?", options: ["Monolito preto", "Anel dourado", "Cubo", "Cristal"], answer: 0 },
      { q: "Quem dirigiu 2001?", options: ["Stanley Kubrick", "Spielberg", "Nolan", "Kurosawa"], answer: 0 },
      { q: "Frase icônica do HAL?", options: ["Sinto muito, Dave, mas não posso fazer isso", "Yippee-ki-yay", "Hello, world", "Nanu nanu"], answer: 0 },
      { q: "Qual música abre o filme?", options: ["Assim Falou Zaratustra", "Bohemian Rhapsody", "Imperial March", "Clair de Lune"], answer: 0 },
    ],
  },
  {
    id: "back-future",
    title: "De Volta para o Futuro",
    emoji: "🚗",
    category: "tempo",
    tagline: "1,21 gigawatts e nenhum plano B pra pilhas AA.",
    questions: [
      { q: "Qual carro vira máquina do tempo?", options: ["DeLorean", "Ford Mustang", "Fusca", "Batmóvel"], answer: 0 },
      { q: "Nome do cientista maluco?", options: ["Doc Brown", "Doc Ock", "Dr. House", "Dr. Strange"], answer: 0 },
      { q: "Marty toca qual música na festa de baile?", options: ["Johnny B. Goode", "Smoke on the Water", "Bohemian Rhapsody", "Sultans of Swing"], answer: 0 },
      { q: "De quantos gigawatts o carro precisa?", options: ["1,21", "9,81", "42", "88"], answer: 0 },
      { q: "Qual velocidade o carro tem que atingir?", options: ["88 mph", "60 mph", "120 km/h", "Velocidade da luz"], answer: 0 },
    ],
  },
  {
    id: "jetsons",
    title: "Os Jetsons",
    emoji: "🛸",
    category: "animação",
    tagline: "Prometeram carro voador em 2000. Ainda esperamos e sem estacionamento.",
    questions: [
      { q: "Como se chama o cachorro dos Jetsons?", options: ["Astro", "Scooby", "Rex", "Pluto"], answer: 0 },
      { q: "O pai da família se chama…", options: ["George", "Fred", "Homer", "Peter"], answer: 0 },
      { q: "A empregada robô é a…", options: ["Rosie", "Wanda", "Mila", "Vera"], answer: 0 },
      { q: "Em que cidade/estrutura eles moram?", options: ["Cidade nas nuvens", "Terra plana", "Base lunar", "Marte"], answer: 0 },
      { q: "Qual meio de transporte é o padrão?", options: ["Carro voador", "Metrô", "Bike", "Teletransporte"], answer: 0 },
    ],
  },
  {
    id: "lotr",
    title: "O Senhor dos Anéis",
    emoji: "💍",
    category: "fantasia",
    tagline: "Nove horas de filme pra jogar um anelzinho num vulcão.",
    questions: [
      { q: "Quem carrega o Um Anel?", options: ["Frodo", "Aragorn", "Legolas", "Gimli"], answer: 0 },
      { q: "Nome do vulcão onde o anel deve ser destruído?", options: ["Montanha da Perdição", "Monte Doom", "Erebor", "Orodruin (aceita ambos, mas escolhe a mais famosa)"], answer: 0 },
      { q: "Quem escreveu os livros?", options: ["J.R.R. Tolkien", "C.S. Lewis", "George R.R. Martin", "Neil Gaiman"], answer: 0 },
      { q: "Qual criatura fala 'meu precioso'?", options: ["Gollum", "Sauron", "Saruman", "Balrog"], answer: 0 },
      { q: "Aragorn é herdeiro de qual reino?", options: ["Gondor", "Rohan", "Mordor", "Shire"], answer: 0 },
    ],
  },
  {
    id: "guardians",
    title: "Guardiões da Galáxia",
    emoji: "🎧",
    category: "espaço",
    tagline: "Salvam o universo ouvindo fita cassete dos anos 70.",
    questions: [
      { q: "Como se chama o líder humano do grupo?", options: ["Peter Quill / Senhor das Estrelas", "Steve Rogers", "Tony Stark", "Thor"], answer: 0 },
      { q: "A árvore que diz só 'Eu sou Groot' é…", options: ["Groot", "Rocket", "Yondu", "Drax"], answer: 0 },
      { q: "Qual guaxinim geneticamente modificado ataca com armas grandes?", options: ["Rocket", "Groot", "Howard", "Cosmo"], answer: 0 },
      { q: "Gamora é filha adotiva de…", options: ["Thanos", "Ronan", "Ego", "Kang"], answer: 0 },
      { q: "Quem é o pai biológico do Peter Quill nos filmes?", options: ["Ego, o Planeta Vivo", "Odin", "Kang", "Vader"], answer: 0 },
    ],
  },
  {
    id: "alien",
    title: "Alien — O 8º Passageiro",
    emoji: "👾",
    category: "aliens",
    tagline: "No espaço, ninguém ouve seu grito. Mas ouve o barulho da geladeira.",
    questions: [
      { q: "Nome da protagonista?", options: ["Ellen Ripley", "Sarah Connor", "Leia", "Lara Croft"], answer: 0 },
      { q: "Quem dirigiu o primeiro Alien?", options: ["Ridley Scott", "James Cameron", "David Fincher", "Jean-Pierre Jeunet"], answer: 0 },
      { q: "Nome da nave do primeiro filme?", options: ["Nostromo", "Sulaco", "Prometheus", "Serenity"], answer: 0 },
      { q: "Como o filhote do Alien nasce?", options: ["Rompendo o peito da vítima", "Do ovo direto", "Do café", "Do escapamento"], answer: 0 },
      { q: "Qual é o slogan do filme?", options: ["No espaço, ninguém ouve seu grito", "É perigoso ir sozinho", "Que a Força esteja com você", "Vem, mas vem devagar"], answer: 0 },
    ],
  },
  {
    id: "martian",
    title: "Perdido em Marte",
    emoji: "🥔",
    category: "espaço",
    tagline: "Botânico vira farmer marciano cultivando batata com… bem, você já sabe.",
    questions: [
      { q: "Quem interpreta o Mark Watney?", options: ["Matt Damon", "Chris Pratt", "Brad Pitt", "Ryan Gosling"], answer: 0 },
      { q: "Que legume ele planta em Marte?", options: ["Batata", "Cenoura", "Alface", "Milho"], answer: 0 },
      { q: "Quem dirigiu o filme?", options: ["Ridley Scott", "Christopher Nolan", "James Cameron", "Denis Villeneuve"], answer: 0 },
      { q: "Como Watney se comunica com a Terra inicialmente?", options: ["Sonda Pathfinder", "SMS", "Pombo-correio", "Sinal de fumaça"], answer: 0 },
      { q: "Nome da missão da qual ele foi deixado pra trás?", options: ["Ares III", "Apollo 13", "Artemis I", "Mercury 7"], answer: 0 },
    ],
  },
  {
    id: "dune",
    title: "Duna",
    emoji: "🐛",
    category: "espaço",
    tagline: "Areia por todo canto. Não recomendado se você é o Anakin.",
    questions: [
      { q: "Qual planeta desértico é o cenário?", options: ["Arrakis", "Tatooine", "Vulcano", "Naboo"], answer: 0 },
      { q: "Como se chama a especiaria mais valiosa?", options: ["Melange", "Kryptonita", "Vibranium", "Adamantium"], answer: 0 },
      { q: "Nome do protagonista?", options: ["Paul Atreides", "Frodo Bolseiro", "Neo", "Ender"], answer: 0 },
      { q: "As criaturas gigantes da areia se chamam…", options: ["Vermes da areia", "Sandmen", "Basiliscos", "Grahboids"], answer: 0 },
      { q: "Quem escreveu o livro?", options: ["Frank Herbert", "Isaac Asimov", "Arthur C. Clarke", "Philip K. Dick"], answer: 0 },
    ],
  },
  {
    id: "mib",
    title: "MIB — Homens de Preto",
    emoji: "🕶️",
    category: "aliens",
    tagline: "Aliens moram na Terra. E pagam aluguel em Nova York.",
    questions: [
      { q: "Que aparelho apaga a memória das testemunhas?", options: ["Neuralizador", "Flashy da Amnésia", "Zap-Erase", "Memory Wiper 3000"], answer: 0 },
      { q: "Quem faz o Agente J?", options: ["Will Smith", "Denzel Washington", "Chris Tucker", "Eddie Murphy"], answer: 0 },
      { q: "E o Agente K é interpretado por…", options: ["Tommy Lee Jones", "Morgan Freeman", "Clint Eastwood", "Robert De Niro"], answer: 0 },
      { q: "Qual bicho da estimação é alienígena no filme?", options: ["O cachorro pug Frank", "Um gato preto", "Um hamster", "Um peixe dourado"], answer: 0 },
      { q: "Onde é a sede secreta dos MIB?", options: ["Nova York", "Roswell", "Área 51", "Londres"], answer: 0 },
    ],
  },
  {
    id: "doctor-who",
    title: "Doctor Who",
    emoji: "📞",
    category: "tempo",
    tagline: "Cabine de polícia por fora, universo inteiro por dentro. Marceneiro nenhum entende.",
    questions: [
      { q: "Como se chama a máquina do tempo do Doutor?", options: ["TARDIS", "DeLorean", "Enterprise", "Millennium Falcon"], answer: 0 },
      { q: "Os principais inimigos com voz metálica são os…", options: ["Daleks", "Cybermen", "Weeping Angels", "Klingons"], answer: 0 },
      { q: "De qual planeta o Doutor é?", options: ["Gallifrey", "Krypton", "Vulcano", "Trantor"], answer: 0 },
      { q: "O que acontece quando o Doutor 'morre'?", options: ["Regenera em novo corpo", "Vira fantasma", "Vira criança", "Fim de jogo"], answer: 0 },
      { q: "A TARDIS por fora parece uma…", options: ["Cabine de polícia britânica", "Cabine telefônica vermelha", "Nave prateada", "Escada rolante"], answer: 0 },
    ],
  },
];

/** Sorteia N perguntas embaralhadas (5 por título — mesmo pool). */
export function shuffleQuestions(list: CinemaQuestion[]): CinemaQuestion[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
