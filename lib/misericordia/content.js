// Orações tradicionais do Terço da Divina Misericórdia (domínio público / tradição devocional).
export const MERCY_CONTENT_VERSION = "misericordia-2026-1";

export const MERCY_PRAYERS = {
  sinal: {
    title: "Sinal da Cruz",
    text: "Em nome do Pai, e do Filho, e do Espírito Santo. Amém.",
  },
  pai: {
    title: "Pai-Nosso",
    text: "Pai nosso que estais nos céus, santificado seja o vosso nome; venha a nós o vosso Reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.",
  },
  ave: {
    title: "Ave-Maria",
    text: "Ave, Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.",
  },
  credo: {
    title: "Creio em Deus Pai",
    text: "Creio em Deus Pai todo-poderoso, criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo; na santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna. Amém.",
  },
  "eterno-pai": {
    title: "Eterno Pai",
    text: "Eterno Pai, eu Vos ofereço o Corpo e o Sangue, a Alma e a Divindade de Vosso diletíssimo Filho, Nosso Senhor Jesus Cristo, em expiação dos nossos pecados e dos do mundo inteiro.",
  },
  "dolorosa-paixao": {
    title: "Pela sua dolorosa Paixão",
    text: "Pela sua dolorosa Paixão, tende misericórdia de nós e do mundo inteiro.",
  },
  "deus-santo": {
    title: "Deus Santo, Deus Forte, Deus Imortal",
    text: "Deus Santo, Deus Forte, Deus Imortal, tende piedade de nós e do mundo inteiro.",
  },
  "oracao-conclusiva": {
    title: "Oração conclusiva (opcional)",
    text: "Deus eterno, em quem a misericórdia é insondável e o tesouro da compaixão é inesgotável, olhai propício para nós e multiplicai em nós a Vossa misericórdia, para que não desesperemos nos momentos difíceis, nem desanimemos, mas nos submetamos com grande confiança à Vossa santa vontade, que é o próprio Amor e a própria Misericórdia. Amém.",
    optional: true,
  },
};

export const MERCY_DECADES = [
  {
    number: 1,
    title: "1ª Dezena da Misericórdia",
    intention:
      "Entregamos ao Pai, por Jesus Cristo, nossas intenções e o pedido de perdão e reconciliação.",
  },
  {
    number: 2,
    title: "2ª Dezena da Misericórdia",
    intention:
      "Unimos nossa oração às famílias, aos enfermos e aos que buscam consolo na fé.",
  },
  {
    number: 3,
    title: "3ª Dezena da Misericórdia",
    intention:
      "Intercedemos pela santa Igreja, pelos sacerdotes e por todos os que anunciam o Evangelho.",
  },
  {
    number: 4,
    title: "4ª Dezena da Misericórdia",
    intention:
      "Pedimos misericórdia pelos que sofrem na solidão, nas provações e nas dores do mundo.",
  },
  {
    number: 5,
    title: "5ª Dezena da Misericórdia",
    intention:
      "Confiamos a Deus as almas que mais necessitam da Sua infinita compaixão e paz.",
  },
];

export const MERCY_STAGE_SUMMARY = [
  {
    number: "01",
    key: "sinal",
    title: "Sinal da Cruz",
    detail: MERCY_PRAYERS.sinal.text,
  },
  {
    number: "02",
    key: "pai",
    title: "Pai-Nosso",
    detail: MERCY_PRAYERS.pai.text,
  },
  {
    number: "03",
    key: "ave",
    title: "Ave-Maria",
    detail: MERCY_PRAYERS.ave.text,
  },
  {
    number: "04",
    key: "credo",
    title: "Credo (Símbolo dos Apóstolos)",
    detail: MERCY_PRAYERS.credo.text,
  },
  {
    number: "05",
    key: "dezenas",
    title: "Cinco dezenas (1 conta grande + 10 contas pequenas em cada)",
    detail: `Na conta grande: "${MERCY_PRAYERS["eterno-pai"].text}" Nas 10 contas pequenas: "${MERCY_PRAYERS["dolorosa-paixao"].text}"`,
  },
  {
    number: "06",
    key: "deus-santo",
    title: "Invocação final (3 vezes)",
    detail: MERCY_PRAYERS["deus-santo"].text,
  },
  {
    number: "07",
    key: "oracao-conclusiva",
    title: "Oração conclusiva",
    detail: MERCY_PRAYERS["oracao-conclusiva"].text,
    optional: true,
  },
];

export const DEFAULT_MERCY_CONTENT = {
  version: MERCY_CONTENT_VERSION,
  prayers: MERCY_PRAYERS,
  decades: MERCY_DECADES,
};
