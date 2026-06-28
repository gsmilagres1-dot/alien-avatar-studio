// 30 destinos exclusivos do modo Equipe — galáxias, nebulosas, exoplanetas,
// sistemas estelares e aglomerados. Banco de 15 perguntas por destino
// (3 níveis × 5) gerado automaticamente a partir dos metadados, mantendo
// o mesmo formato do banco singular (BankQuestion).

import type { BankQuestion } from "@/lib/intergalactic-questions";

export type TeamDestKind =
  | "galaxy"
  | "nebula"
  | "exoplanet"
  | "star_system"
  | "cluster"
  | "quasar";

export interface TeamDestination {
  id: string;
  name: string;
  kind: TeamDestKind;
  transport: string;
  level: 1 | 2 | 3 | 4 | 5;
  /** Distância em anos-luz (texto livre p/ aceitar "2.5 milhões"). */
  distance: string;
  constellation: string;
  /** Fato 1: descoberta / ano. */
  discovered: string;
  /** Fato 2: característica marcante. */
  highlight: string;
  /** Fato 3: curiosidade extra. */
  trivia: string;
}

const KIND_LABEL: Record<TeamDestKind, string> = {
  galaxy: "galáxia",
  nebula: "nebulosa",
  exoplanet: "exoplaneta",
  star_system: "sistema estelar",
  cluster: "aglomerado",
  quasar: "quasar",
};

export const TEAM_DESTINATIONS: TeamDestination[] = [
  { id: "andromeda",       name: "Galáxia de Andrômeda (M31)", kind: "galaxy",       transport: "dobra warp",            level: 4, distance: "2,5 milhões de anos-luz", constellation: "Andrômeda",   discovered: "964 d.C. por Al-Sufi",     highlight: "vai colidir com a Via Láctea em ~4,5 bi de anos", trivia: "é a galáxia espiral mais próxima da nossa" },
  { id: "triangulum",      name: "Galáxia do Triângulo (M33)", kind: "galaxy",       transport: "salto hiperespacial",   level: 4, distance: "2,7 milhões de anos-luz", constellation: "Triângulo",   discovered: "1654 por Hodierna",        highlight: "3ª maior do Grupo Local",                          trivia: "visível a olho nu em céus muito escuros" },
  { id: "sombrero",        name: "Galáxia do Sombreiro (M104)", kind: "galaxy",      transport: "vela solar",            level: 4, distance: "29 milhões de anos-luz",  constellation: "Virgem",      discovered: "1781 por Méchain",         highlight: "tem um bojo brilhante e disco fino",               trivia: "possui buraco negro central de 1 bilhão de massas solares" },
  { id: "whirlpool",       name: "Galáxia Redemoinho (M51)",   kind: "galaxy",       transport: "dobra warp",            level: 4, distance: "23 milhões de anos-luz",  constellation: "Cães de Caça", discovered: "1773 por Messier",        highlight: "1ª galáxia reconhecida como espiral",              trivia: "interage com a companheira NGC 5195" },
  { id: "pinwheel",        name: "Galáxia Cata-Vento (M101)",  kind: "galaxy",       transport: "dobra warp",            level: 4, distance: "21 milhões de anos-luz",  constellation: "Ursa Maior",   discovered: "1781 por Méchain",         highlight: "70% maior que a Via Láctea",                       trivia: "famosa pela simetria quase perfeita" },
  { id: "cigar",           name: "Galáxia do Charuto (M82)",   kind: "galaxy",       transport: "salto hiperespacial",   level: 5, distance: "12 milhões de anos-luz",  constellation: "Ursa Maior",   discovered: "1774 por Bode",            highlight: "starburst — taxa de formação estelar enorme",       trivia: "tem fluxo de hidrogênio jorrando do centro" },
  { id: "centaurus_a",     name: "Centaurus A (NGC 5128)",     kind: "galaxy",       transport: "salto hiperespacial",   level: 5, distance: "12 milhões de anos-luz",  constellation: "Centauro",    discovered: "1826 por Dunlop",          highlight: "radiogaláxia mais próxima",                         trivia: "tem faixa escura de poeira cortando o disco" },
  { id: "smc",             name: "Pequena Nuvem de Magalhães", kind: "galaxy",       transport: "nave estelar",          level: 3, distance: "200 mil anos-luz",        constellation: "Tucano",      discovered: "registro pré-histórico",   highlight: "satélite da Via Láctea",                            trivia: "visível a olho nu do hemisfério sul" },
  { id: "lmc",             name: "Grande Nuvem de Magalhães",  kind: "galaxy",       transport: "nave estelar",          level: 3, distance: "163 mil anos-luz",        constellation: "Dourado",     discovered: "registro pré-histórico",   highlight: "abriga a Nebulosa da Tarântula",                    trivia: "hospedou a Supernova SN 1987A" },
  { id: "messier_87",      name: "M87 (Virgo A)",              kind: "galaxy",       transport: "dobra warp",            level: 5, distance: "53 milhões de anos-luz",  constellation: "Virgem",      discovered: "1781 por Messier",         highlight: "1ª foto direta de um buraco negro (EHT, 2019)",     trivia: "possui jato relativístico de 5 mil anos-luz" },

  { id: "orion_nebula",    name: "Nebulosa de Órion (M42)",    kind: "nebula",       transport: "nave fotônica",         level: 2, distance: "1.344 anos-luz",          constellation: "Órion",       discovered: "1610 por Peiresc",         highlight: "berçário estelar visível a olho nu",                trivia: "fica no 'punhal' do Caçador" },
  { id: "eagle_nebula",    name: "Nebulosa da Águia (M16)",    kind: "nebula",       transport: "nave fotônica",         level: 3, distance: "7 mil anos-luz",          constellation: "Serpente",    discovered: "1745 por de Chéseaux",     highlight: "abriga os 'Pilares da Criação'",                    trivia: "fotografada pelo Hubble em 1995" },
  { id: "crab_nebula",     name: "Nebulosa do Caranguejo (M1)", kind: "nebula",      transport: "nave fotônica",         level: 3, distance: "6,5 mil anos-luz",        constellation: "Touro",       discovered: "1731 por Bevis",           highlight: "remanescente da supernova de 1054",                 trivia: "tem um pulsar de 33 ms no centro" },
  { id: "horsehead",       name: "Nebulosa Cabeça de Cavalo",  kind: "nebula",       transport: "nave fotônica",         level: 3, distance: "1.500 anos-luz",          constellation: "Órion",       discovered: "1888 por Williamina Fleming", highlight: "nebulosa escura em silhueta",                    trivia: "parte do complexo molecular de Órion" },
  { id: "carina_nebula",   name: "Nebulosa de Carina",         kind: "nebula",       transport: "nave fotônica",         level: 3, distance: "8.500 anos-luz",          constellation: "Quilha",      discovered: "1751 por Lacaille",        highlight: "abriga a estrela Eta Carinae",                      trivia: "primeira imagem profunda do James Webb (2022)" },
  { id: "ring_nebula",     name: "Nebulosa do Anel (M57)",     kind: "nebula",       transport: "nave fotônica",         level: 3, distance: "2.300 anos-luz",          constellation: "Lira",        discovered: "1779 por Darquier",        highlight: "nebulosa planetária em forma de anel",              trivia: "tem uma anã branca de 100 mil K no centro" },

  { id: "trappist_1e",     name: "TRAPPIST-1e",                kind: "exoplanet",    transport: "buraco de minhoca",     level: 5, distance: "39,5 anos-luz",           constellation: "Aquário",     discovered: "2017 pela ESO",            highlight: "na zona habitável de uma anã ultra-fria",            trivia: "um dos 7 planetas do sistema TRAPPIST-1" },
  { id: "kepler_186f",     name: "Kepler-186f",                kind: "exoplanet",    transport: "buraco de minhoca",     level: 5, distance: "582 anos-luz",            constellation: "Cisne",       discovered: "2014 pela NASA",           highlight: "1º planeta do tamanho da Terra na zona habitável",  trivia: "orbita uma anã vermelha em 130 dias" },
  { id: "kepler_452b",     name: "Kepler-452b",                kind: "exoplanet",    transport: "buraco de minhoca",     level: 5, distance: "1.400 anos-luz",          constellation: "Cisne",       discovered: "2015 pela NASA",           highlight: "apelidada de 'prima maior da Terra'",               trivia: "ano dura 385 dias terrestres" },
  { id: "proxima_c",       name: "Proxima Centauri c",         kind: "exoplanet",    transport: "vela solar",            level: 4, distance: "4,2 anos-luz",            constellation: "Centauro",    discovered: "2020",                     highlight: "super-Terra na estrela mais próxima do Sol",        trivia: "orbita a 1,5 UA da Proxima" },
  { id: "hd_209458b",      name: "HD 209458 b (Osiris)",       kind: "exoplanet",    transport: "buraco de minhoca",     level: 5, distance: "159 anos-luz",            constellation: "Pégaso",      discovered: "1999",                     highlight: "1º exoplaneta com atmosfera detectada",             trivia: "Júpiter quente perdendo gás para o espaço" },
  { id: "55_cancri_e",     name: "55 Cancri e",                kind: "exoplanet",    transport: "buraco de minhoca",     level: 5, distance: "41 anos-luz",             constellation: "Câncer",      discovered: "2004",                     highlight: "pode ter superfície de carbono / diamante",         trivia: "ano dura apenas 18 horas" },

  { id: "alpha_cen_b",     name: "Alpha Centauri B",           kind: "star_system",  transport: "vela solar",            level: 4, distance: "4,37 anos-luz",           constellation: "Centauro",    discovered: "registro antigo",          highlight: "anã laranja no sistema tríplice mais próximo",      trivia: "Próxima Centauri é a 3ª estrela do sistema" },
  { id: "sirius",          name: "Sirius A & B",               kind: "star_system",  transport: "nave fotônica",         level: 3, distance: "8,6 anos-luz",            constellation: "Cão Maior",   discovered: "conhecida na antiguidade",  highlight: "estrela mais brilhante do céu noturno",            trivia: "Sirius B é uma anã branca densa" },
  { id: "vega",            name: "Vega",                       kind: "star_system",  transport: "nave fotônica",         level: 3, distance: "25 anos-luz",             constellation: "Lira",        discovered: "catalogada por Hiparco",   highlight: "estrela de referência fotométrica",                 trivia: "será a Estrela do Norte em ~12.000 anos" },
  { id: "betelgeuse_team", name: "Betelgeuse (visita guiada)", kind: "star_system",  transport: "salto hiperespacial",   level: 5, distance: "548 anos-luz",            constellation: "Órion",       discovered: "conhecida na antiguidade",  highlight: "supergigante vermelha prestes a explodir",         trivia: "ombro do Caçador de Órion" },

  { id: "pleiades",        name: "Plêiades (M45)",             kind: "cluster",      transport: "nave estelar",          level: 2, distance: "444 anos-luz",            constellation: "Touro",       discovered: "conhecidas há milênios",   highlight: "aglomerado aberto das 'Sete Irmãs'",                trivia: "símbolo da marca Subaru" },
  { id: "hyades",          name: "Híades",                     kind: "cluster",      transport: "nave estelar",          level: 2, distance: "153 anos-luz",            constellation: "Touro",       discovered: "conhecidas há milênios",   highlight: "aglomerado aberto mais próximo da Terra",           trivia: "forma a 'cabeça' do Touro" },
  { id: "omega_centauri",  name: "Omega Centauri",             kind: "cluster",      transport: "nave estelar",          level: 4, distance: "17.000 anos-luz",         constellation: "Centauro",    discovered: "1677 por Halley",          highlight: "maior aglomerado globular da Via Láctea",           trivia: "tem ~10 milhões de estrelas" },

  { id: "3c_273",          name: "Quasar 3C 273",              kind: "quasar",       transport: "dobra warp",            level: 5, distance: "2,4 bilhões de anos-luz", constellation: "Virgem",      discovered: "1963 por Schmidt",         highlight: "1º quasar identificado",                            trivia: "mais brilhante que 100 Vias Lácteas" },
];

/** Gera 15 perguntas (3 níveis × 5) para o destino, totalmente baseadas
 *  em seus metadados, com 4 alternativas cada e resposta no índice 0. */
export function buildTeamBank(dest: TeamDestination): BankQuestion[] {
  const kindLbl = KIND_LABEL[dest.kind];
  const out: BankQuestion[] = [];

  // ---------- Nível 1 (fácil) ----------
  out.push({ level: 1, q: `${dest.name} é classificada como qual tipo de objeto?`, choices: [kindLbl, "satélite artificial", "cometa", "planeta anão"], answer: 0 });
  out.push({ level: 1, q: `Em qual constelação ${dest.name} é observada?`, choices: [dest.constellation, "Cruzeiro do Sul", "Órion", "Ursa Maior"], answer: 0 });
  out.push({ level: 1, q: `${dest.name} está em qual reino do espaço?`, choices: [kindLbl === "exoplaneta" || kindLbl === "sistema estelar" ? "fora do Sistema Solar" : "fora da Via Láctea ou bem distante", "dentro do nosso planeta", "na atmosfera da Terra", "na Lua"], answer: 0 });
  out.push({ level: 1, q: `${dest.name} pode ser visitada em uma viagem em equipe usando qual transporte?`, choices: [dest.transport, "ônibus urbano", "bicicleta", "metrô"], answer: 0 });
  out.push({ level: 1, q: `${dest.name} fica perto da Terra a ponto de chegarmos em um dia?`, choices: ["Não, é muito distante", "Sim, em 1h", "Sim, dá pra ir a pé", "Sim, de carro"], answer: 0 });

  // ---------- Nível 2 (médio) ----------
  out.push({ level: 2, q: `Qual é a distância aproximada de ${dest.name} até a Terra?`, choices: [dest.distance, "10 km", "1 ano-luz", "100 metros"], answer: 0 });
  out.push({ level: 2, q: `Quando ${dest.name} foi descoberta/registrada?`, choices: [dest.discovered, "ontem", "no século 21 por amadores", "nunca foi descoberta"], answer: 0 });
  out.push({ level: 2, q: `O que torna ${dest.name} marcante para os astrônomos?`, choices: [dest.highlight, "ter forma cúbica", "girar ao contrário do universo", "ser invisível em qualquer comprimento de onda"], answer: 0 });
  out.push({ level: 2, q: `Uma curiosidade verdadeira sobre ${dest.name} é:`, choices: [dest.trivia, "ser feita de chocolate", "habitar dinossauros vivos", "produzir oxigênio para a Terra"], answer: 0 });
  out.push({ level: 2, q: `${dest.name} faz parte de qual categoria astronômica?`, choices: [kindLbl, "móvel urbano", "objeto de cozinha", "elemento químico"], answer: 0 });

  // ---------- Nível 3 (difícil) ----------
  out.push({ level: 3, q: `A constelação de fundo onde ${dest.name} aparece é:`, choices: [dest.constellation, "Triângulo das Bermudas", "Constelação do Pão", "Não tem constelação"], answer: 0 });
  out.push({ level: 3, q: `A distância de ${dest.name} é medida em:`, choices: ["anos-luz (não em km cotidianos)", "metros", "passos", "minutos de carro"], answer: 0 });
  out.push({ level: 3, q: `Quem ou quando registrou ${dest.name}?`, choices: [dest.discovered, "Coca-Cola em 1980", "Nintendo em 1990", "Nenhum cientista conhecido"], answer: 0 });
  out.push({ level: 3, q: `O destaque científico de ${dest.name} é:`, choices: [dest.highlight, "ter cheiro de baunilha", "ser ouvida com fone de ouvido", "aparecer só em desenhos animados"], answer: 0 });
  out.push({ level: 3, q: `Uma curiosidade extra confirmada sobre ${dest.name}:`, choices: [dest.trivia, "é o nome de um shopping", "fica em São Paulo", "é o título de uma novela"], answer: 0 });

  return out;
}

export function getTeamDestination(id: string): TeamDestination | undefined {
  return TEAM_DESTINATIONS.find((d) => d.id === id);
}

export function getTeamBank(id: string): BankQuestion[] {
  const d = getTeamDestination(id);
  return d ? buildTeamBank(d) : [];
}

export const TEAM_KIND_LABEL = KIND_LABEL;
