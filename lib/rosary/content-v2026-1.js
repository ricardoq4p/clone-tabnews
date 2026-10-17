// Orações tradicionais de domínio público. Meditações e ilustrações originais.
// Referências doutrinais: Vaticano, Santo Rosário e Compêndio do Catecismo.
export const CONTENT_VERSION = "rosary-2026-1";
export const PRAYERS = {
  sinal: {
    title: "Sinal da Cruz",
    text: "Em nome do Pai, e do Filho, e do Espírito Santo. Amém.",
  },
  oferecimento: {
    title: "Oferecimento",
    text: "Divino Jesus, nós vos oferecemos este terço que vamos rezar, contemplando os mistérios da nossa Redenção. Concedei-nos, por intercessão da Virgem Maria, Mãe de Deus e nossa Mãe, as virtudes necessárias para bem rezá-lo e a graça de ganhar as indulgências desta santa devoção.",
  },
  credo: {
    title: "Creio em Deus Pai",
    text: "Creio em Deus Pai todo-poderoso, criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo; na santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna. Amém.",
  },
  pai: {
    title: "Pai-Nosso",
    text: "Pai nosso que estais nos céus, santificado seja o vosso nome; venha a nós o vosso Reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.",
  },
  ave: {
    title: "Ave-Maria",
    text: "Ave, Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.",
  },
  gloria: {
    title: "Glória ao Pai",
    text: "Glória ao Pai, e ao Filho, e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.",
  },
  fatima: {
    title: "Jaculatória de Fátima",
    text: "Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno, levai as almas todas para o céu e socorrei principalmente as que mais precisarem.",
  },
  agradecimento: {
    title: "Agradecimento",
    text: "Infinitas graças vos damos, soberana Rainha, pelos benefícios que todos os dias recebemos de vossas mãos liberais. Dignai-vos, agora e para sempre, tomar-nos debaixo de vosso poderoso amparo. E, para mais vos obrigar, vos saudamos com uma Salve-Rainha.",
  },
  salve: {
    title: "Salve-Rainha",
    text: "Salve, Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve! A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei; e depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria! Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.",
  },
  final: {
    title: "Oração final",
    text: "Ó Deus, cujo Filho unigênito, por sua vida, morte e ressurreição, nos mereceu os prêmios da salvação eterna, concedei-nos, nós vos pedimos, que, meditando os mistérios do Santíssimo Rosário da bem-aventurada Virgem Maria, imitemos o que contêm e alcancemos o que prometem. Por Cristo, nosso Senhor. Amém.",
  },
};
export const MYSTERY_PAINTINGS = {
  anunciacao: {
    image: "/images/rosario/gozosos/anunciacao.webp",
    credit: "Pintura sacra restaurada — Acervo PanteraLab",
  },
  visitacao: {
    image: "/images/rosario/gozosos/visitacao.webp",
    credit: "Pintura sacra restaurada — Acervo PanteraLab",
  },
  nascimento: {
    image: "/images/rosario/gozosos/nascimento.webp",
    credit: "Pintura sacra restaurada — Acervo PanteraLab",
  },
  apresentacao: {
    image: "/images/rosario/gozosos/apresentacao.webp",
    credit: "Pintura sacra restaurada — Acervo PanteraLab",
  },
  encontro: {
    image: "/images/rosario/gozosos/encontro.webp",
    credit: "Pintura sacra restaurada — Acervo PanteraLab",
  },
  batismo: {
    image: "/images/rosario/luminosos/batismo.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  cana: {
    image: "/images/rosario/luminosos/cana.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  reino: {
    image: "/images/rosario/luminosos/reino.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  transfiguracao: {
    image: "/images/rosario/luminosos/transfiguracao.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  eucaristia: {
    image: "/images/rosario/luminosos/eucaristia.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  agonia: {
    image: "/images/rosario/dolorosos/agonia.webp",
    credit: "Pintura sacra original — Acervo PanteraLab",
  },
  flagelacao: {
    image: "/images/rosario/dolorosos/flagelacao.webp",
    credit: "Pintura sacra original — Acervo PanteraLab",
  },
  "coroacao-espinhos": {
    image: "/images/rosario/dolorosos/coroacao-espinhos.webp",
    credit: "Pintura sacra original — Acervo PanteraLab",
  },
  "caminho-cruz": {
    image: "/images/rosario/dolorosos/caminho-cruz.webp",
    credit: "Pintura sacra original — Acervo PanteraLab",
  },
  crucificacao: {
    image: "/images/rosario/dolorosos/crucificacao.webp",
    credit: "Pintura sacra original — Acervo PanteraLab",
  },
  ressurreicao: {
    image: "/images/rosario/gloriosos/ressurreicao.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  ascensao: {
    image: "/images/rosario/gloriosos/ascensao.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  pentecostes: {
    image: "/images/rosario/gloriosos/pentecostes.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  assuncao: {
    image: "/images/rosario/gloriosos/assuncao.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
  "coroacao-maria": {
    image: "/images/rosario/gloriosos/coroacao-maria.webp",
    credit: "Pintura sacra digital original — PanteraLab",
  },
};
export function resolveMysteryArtwork(item) {
  if (!item) return { image: "", imageAlt: "", credit: "" };
  const painting = MYSTERY_PAINTINGS[item.id];
  if (painting && (!item.image || item.image === `/sacred/${item.id}.svg`)) {
    return {
      image: painting.image,
      imageAlt: `Pintura sacra: ${item.title}`,
      credit: painting.credit,
    };
  }
  return {
    image: item.image,
    imageAlt: item.imageAlt || `Pintura sacra: ${item.title}`,
    credit: item.credit,
  };
}
const mystery = (id, title, scripture, meditation) => {
  const painting = MYSTERY_PAINTINGS[id];
  return {
    id,
    title,
    scripture,
    meditation,
    image: painting ? painting.image : `/sacred/${id}.svg`,
    imageAlt: painting
      ? `Pintura sacra: ${title}`
      : `Ilustração simbólica: ${title}`,
    credit: painting ? painting.credit : "Arte vetorial original PanteraLab",
    source: "Meditação original a partir da referência bíblica indicada.",
  };
};
export const MYSTERY_SETS = [
  {
    id: "gozosos",
    title: "Gozosos",
    subtitle: "A alegria de acolher a vida",
    days: [1, 6],
    color: "rose",
    source:
      "https://www.vatican.va/special/rosary/documents/misteri_gaudiosi_po.html",
    mysteries: [
      mystery(
        "anunciacao",
        "A anunciação do Anjo a Maria",
        "Lc 1,26–38",
        "Maria acolhe a Palavra com liberdade e confiança. Contemplemos seu sim e peçamos um coração disponível para a vontade de Deus, mesmo quando ainda não compreendemos o caminho.",
      ),
      mystery(
        "visitacao",
        "A visitação de Maria a Isabel",
        "Lc 1,39–56",
        "A presença de Jesus leva Maria ao encontro de quem precisa. Peçamos a graça de transformar nossa fé em serviço, reconhecendo a dignidade de cada pessoa que encontramos.",
      ),
      mystery(
        "nascimento",
        "O nascimento de Jesus em Belém",
        "Lc 2,1–20",
        "O Filho de Deus vem ao mundo na simplicidade de uma manjedoura. Contemplemos sua humildade e abramos espaço para acolher Cristo nos pequenos e esquecidos.",
      ),
      mystery(
        "apresentacao",
        "A apresentação de Jesus no Templo",
        "Lc 2,22–40",
        "Maria e José apresentam Jesus ao Pai. Com Simeão e Ana, aprendamos a esperar com perseverança e a reconhecer a luz de Deus em nossa vida cotidiana.",
      ),
      mystery(
        "encontro",
        "O encontro de Jesus no Templo",
        "Lc 2,41–52",
        "Maria e José procuram Jesus com amor perseverante. Quando nos sentimos distantes, peçamos a graça de procurá-lo na Palavra, na oração e na vida da Igreja.",
      ),
    ],
  },
  {
    id: "luminosos",
    title: "Luminosos",
    subtitle: "Cristo, luz do nosso caminho",
    days: [4],
    color: "gold",
    source:
      "https://www.vatican.va/special/rosary/documents/misteri_luminosi_po.html",
    mysteries: [
      mystery(
        "batismo",
        "O batismo de Jesus no Jordão",
        "Mt 3,13–17",
        "Jesus entra nas águas do Jordão e o Pai manifesta seu amor pelo Filho. Recordemos nosso Batismo e peçamos a graça de viver como filhos de Deus, conduzidos pelo Espírito Santo.",
      ),
      mystery(
        "cana",
        "A autorrevelação de Jesus nas bodas de Caná",
        "Jo 2,1–12",
        "Maria percebe a necessidade dos noivos e nos conduz a Jesus. Aprendamos a escutar o Senhor e a fazer o que Ele nos disser, com confiança e generosidade.",
      ),
      mystery(
        "reino",
        "O anúncio do Reino de Deus",
        "Mc 1,14–15",
        "Jesus anuncia a proximidade do Reino e convida à conversão. Apresentemos a Ele o que precisa ser transformado em nós e acolhamos sua misericórdia com sinceridade.",
      ),
      mystery(
        "transfiguracao",
        "A transfiguração do Senhor",
        "Mt 17,1–9",
        "No monte, os discípulos contemplam a glória de Cristo e são chamados a escutá-lo. Peçamos que a luz de sua presença sustente nossa fidelidade também nos momentos de escuridão.",
      ),
      mystery(
        "eucaristia",
        "A instituição da Eucaristia",
        "Mt 26,26–29; Lc 22,14–20",
        "Jesus se oferece por nós e nos dá seu Corpo e seu Sangue. Contemplemos este dom de amor e cresçamos na participação da Santa Missa e no serviço aos irmãos.",
      ),
    ],
  },
  {
    id: "dolorosos",
    title: "Dolorosos",
    subtitle: "O amor que permanece na cruz",
    days: [2, 5],
    color: "purple",
    source:
      "https://www.vatican.va/special/rosary/documents/misteri_dolorosi_po.html",
    mysteries: [
      mystery(
        "agonia",
        "A agonia de Jesus no Horto",
        "Mt 26,36–46",
        "No Getsêmani, Jesus apresenta ao Pai sua angústia e permanece fiel. Entreguemos nossas aflições a Deus e peçamos a força de vigiar e rezar com quem sofre.",
      ),
      mystery(
        "flagelacao",
        "A flagelação de Jesus",
        "Jo 19,1",
        "Contemplemos Jesus ferido pela violência humana. Peçamos perdão por nossas faltas e um coração atento à dignidade de todas as pessoas que sofrem agressão e abandono.",
      ),
      mystery(
        "coroacao-espinhos",
        "A coroação de espinhos",
        "Mt 27,27–31",
        "Jesus é humilhado, mas seu amor não se converte em ódio. Peçamos humildade para renunciar ao orgulho e coragem para defender quem é desprezado.",
      ),
      mystery(
        "caminho-cruz",
        "Jesus carrega a cruz",
        "Lc 23,26–32",
        "Jesus segue o caminho do Calvário, e Simão de Cirene o ajuda. Peçamos a graça de carregar nossas cruzes com esperança e de aliviar os fardos de nossos irmãos.",
      ),
      mystery(
        "crucificacao",
        "A crucifixão e morte de Jesus",
        "Jo 19,25–30",
        "Ao pé da cruz, Maria permanece junto de Jesus. Contemplemos o amor de Cristo até o fim e confiemos à sua misericórdia nossas feridas e as dores do mundo.",
      ),
    ],
  },
  {
    id: "gloriosos",
    title: "Gloriosos",
    subtitle: "A esperança que vence a morte",
    days: [0, 3],
    color: "blue",
    source:
      "https://www.vatican.va/special/rosary/documents/misteri_gloriosi_po.html",
    mysteries: [
      mystery(
        "ressurreicao",
        "A ressurreição de Jesus",
        "Lc 24,1–12",
        "O túmulo vazio anuncia que a morte não tem a última palavra. Peçamos ao Ressuscitado uma esperança viva e a coragem de testemunhar seu amor em nossa vida.",
      ),
      mystery(
        "ascensao",
        "A ascensão de Jesus ao Céu",
        "At 1,6–11",
        "Jesus volta ao Pai e confia aos discípulos a missão de testemunhar o Evangelho. Rezemos para que nossa esperança do Céu se traduza em fidelidade e caridade aqui na terra.",
      ),
      mystery(
        "pentecostes",
        "A vinda do Espírito Santo",
        "At 2,1–13",
        "Reunida em oração, a Igreja recebe o Espírito Santo. Com Maria, peçamos seus dons para viver a comunhão e anunciar Jesus com coragem e mansidão.",
      ),
      mystery(
        "assuncao",
        "A assunção de Maria ao Céu",
        "Lc 1,46–55; Ap 12,1",
        "A Igreja celebra Maria elevada ao Céu em corpo e alma, por graça de Deus. Contemplemos nela a esperança da ressurreição e confiemos ao Senhor nossa vida inteira.",
      ),
      mystery(
        "coroacao-maria",
        "A coroação de Maria como Rainha",
        "Ap 12,1; Lc 1,48–49",
        "Maria participa da glória de seu Filho e intercede por nós. Seu reinado nos aponta para o serviço e para a fidelidade a Cristo: peçamos que ela nos acompanhe em nosso caminho.",
      ),
    ],
  },
];
export const DEFAULT_CONTENT = {
  version: CONTENT_VERSION,
  prayers: PRAYERS,
  sets: MYSTERY_SETS,
};
export const CONTENT_SOURCES = [
  {
    label: "Os mistérios do Santo Rosário — Santa Sé",
    url: "https://www.vatican.va/special/rosary/documents/misteri_po.html",
  },
  {
    label: "Orações comuns — Compêndio do Catecismo",
    url: "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_po.html",
  },
];
