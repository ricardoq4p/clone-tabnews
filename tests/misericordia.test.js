import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_MERCY_CONTENT,
  MERCY_PRAYERS,
} from "../lib/misericordia/content";
import {
  buildMercyChaplet,
  buildMercySections,
  newMercyProgress,
  validMercyProgress,
} from "../lib/misericordia/engine";
import {
  MERCY_AUDIO_MANIFEST,
  areMercyRecordingsIntegrated,
  buildMercyAudioSequence,
  narrationForMercyStep,
  resolveMercyAudio,
} from "../lib/misericordia/audio-catalog";
import {
  MercyAudioController,
  readMercyCheckpoint,
  writeMercyCheckpoint,
} from "../lib/misericordia/audio-controller";

class MockMedia extends EventTarget {
  constructor() {
    super();
    this.src = "";
    this.currentTime = 0;
    this.duration = 24;
    this.ended = false;
    this.playbackRate = 1;
    this.pause = jest.fn();
    this.load = jest.fn();
    this.removeAttribute = jest.fn((attr) => {
      if (attr === "src") this.src = "";
    });
    this.play = jest.fn(async () => {
      this.dispatchEvent(new Event("playing"));
    });
  }

  fire(event) {
    this.dispatchEvent(new Event(event));
  }
}

function createHarness(
  initialStepIndex = 0,
  options = { closingPrayer: true },
) {
  const steps = buildMercyChaplet(options);
  const media = new MockMedia();
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
  let position = initialStepIndex;
  const scope = "visitor:test-run";
  const states = [];

  let controller;
  const loadStep = (pos, keepPlaying = false) => {
    position = pos;
    const completed = position >= steps.length;
    const step = !completed ? steps[position] : null;
    const clip = resolveMercyAudio(step);
    controller.load(
      {
        scope,
        position,
        stepId: step?.id || null,
        clip,
        completed,
      },
      keepPlaying,
    );
  };

  const advance = jest.fn((expected) => {
    if (expected.position !== position || expected.scope !== scope) {
      return false;
    }
    loadStep(position + 1, true);
    return true;
  });

  controller = new MercyAudioController(
    media,
    storage,
    (next) => states.push({ ...next, position }),
    advance,
  );

  loadStep(initialStepIndex, false);

  return {
    steps,
    media,
    storage,
    controller,
    advance,
    states,
    scope,
    getPosition: () => position,
    loadStep,
  };
}

describe("Terço da Divina Misericórdia — Estrutura e Sequência das Orações", () => {
  test("organiza a sequência tradicional completa com 63 etapas (incluindo oração conclusiva opcional) e 62 sem ela", () => {
    const withClosing = buildMercyChaplet({ closingPrayer: true });
    const withoutClosing = buildMercyChaplet({ closingPrayer: false });

    expect(withClosing).toHaveLength(63);
    expect(withoutClosing).toHaveLength(62);

    // 1 a 4: Sinal da Cruz, Pai-Nosso, Ave-Maria, Credo
    expect(withClosing.slice(0, 4).map((s) => s.prayer)).toEqual([
      "sinal",
      "pai",
      "ave",
      "credo",
    ]);
    expect(withClosing[0].text).toBe(MERCY_PRAYERS.sinal.text);
    expect(withClosing[1].text).toBe(MERCY_PRAYERS.pai.text);
    expect(withClosing[2].text).toBe(MERCY_PRAYERS.ave.text);
    expect(withClosing[3].text).toBe(MERCY_PRAYERS.credo.text);

    // 5: Cinco dezenas (cada uma com 1 "Eterno Pai" + 10 "Pela sua dolorosa Paixão")
    const decadeSteps = withClosing.slice(4, 59);
    expect(decadeSteps).toHaveLength(55);

    for (let decade = 0; decade < 5; decade++) {
      const slice = decadeSteps.slice(decade * 11, (decade + 1) * 11);
      expect(slice).toHaveLength(11);
      expect(slice[0].prayer).toBe("eterno-pai");
      expect(slice[0].beadType).toBe("large");
      expect(slice[0].decadeNumber).toBe(decade + 1);
      expect(slice[0].text).toBe(MERCY_PRAYERS["eterno-pai"].text);

      const smallBeads = slice.slice(1);
      expect(smallBeads).toHaveLength(10);
      smallBeads.forEach((step, idx) => {
        expect(step.prayer).toBe("dolorosa-paixao");
        expect(step.beadType).toBe("small");
        expect(step.bead).toBe(idx + 1);
        expect(step.beadTotal).toBe(10);
        expect(step.decadeNumber).toBe(decade + 1);
        expect(step.text).toBe(MERCY_PRAYERS["dolorosa-paixao"].text);
      });
    }

    // 6: Invocação final "Deus Santo, Deus Forte, Deus Imortal" rezada 3 vezes
    const trisagion = withClosing.slice(59, 62);
    expect(trisagion).toHaveLength(3);
    trisagion.forEach((step, idx) => {
      expect(step.prayer).toBe("deus-santo");
      expect(step.bead).toBe(idx + 1);
      expect(step.beadTotal).toBe(3);
      expect(step.text).toBe(MERCY_PRAYERS["deus-santo"].text);
    });

    // 7: Oração conclusiva opcional claramente identificada
    const closing = withClosing[62];
    expect(closing.prayer).toBe("oracao-conclusiva");
    expect(closing.optional).toBe(true);
    expect(closing.text).toBe(MERCY_PRAYERS["oracao-conclusiva"].text);

    // Seções estruturadas do roteiro
    const sections = buildMercySections(withClosing);
    expect(sections).toHaveLength(8);
    expect(sections[7].optional).toBe(true);
  });

  test("valida progresso salvo com e sem oração conclusiva opcional", () => {
    const progress = newMercyProgress({ closingPrayer: true });
    expect(validMercyProgress(progress)).toBe(true);
    expect(validMercyProgress({ ...progress, position: 63 })).toBe(true);
    expect(validMercyProgress({ ...progress, position: 64 })).toBe(false);
    expect(
      validMercyProgress({
        ...progress,
        closingPrayer: false,
        position: 62,
      }),
    ).toBe(true);
    expect(
      validMercyProgress({
        ...progress,
        closingPrayer: false,
        position: 63,
      }),
    ).toBe(false);
    expect(validMercyProgress(null, DEFAULT_MERCY_CONTENT)).toBe(false);
  });
});

describe("Terço da Divina Misericórdia — Catálogo e Preparação de Áudios", () => {
  test("mapeia todas as 63 etapas para os 8 arquivos reais de áudio integrados e valida metadados e existência em disco", () => {
    expect(areMercyRecordingsIntegrated()).toBe(true);
    expect(MERCY_AUDIO_MANIFEST.status).toBe("ready");

    const steps = buildMercyChaplet({ closingPrayer: true });
    const sequence = buildMercyAudioSequence({ closingPrayer: true });
    expect(sequence).toHaveLength(63);
    expect(sequence[0].file).toBe("01-sinal-da-cruz.mp3");
    expect(sequence[1].file).toBe("02-pai-nosso.mp3");
    expect(sequence[2].file).toBe("03-ave-maria.mp3");
    expect(sequence[3].file).toBe("04-credo.mp3");
    expect(sequence[4].file).toBe("05-eterno-pai.mp3");
    expect(sequence[5].file).toBe("06-pela-sua-dolorosa-paixao.mp3");
    expect(sequence[59].file).toBe("07-deus-santo.mp3");
    expect(sequence[62].file).toBe("08-oracao-conclusiva.mp3");

    for (let i = 0; i < sequence.length; i++) {
      const item = sequence[i];
      const resolved = resolveMercyAudio(steps[i]);
      expect(item.src).toMatch(/^\/audio\/misericordia\/0[1-8]-[a-z-]+\.mp3$/);
      expect(item.recorded).toBe(true);
      expect(resolved.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(resolved.id).toContain(resolved.sha256);
      expect(resolved.duration).toBeGreaterThan(resolved.narrationEnd);
      expect(resolved.narrationEnd).toBeGreaterThan(0);

      const diskPath = path.join(process.cwd(), "public", item.src);
      expect(fs.existsSync(diskPath)).toBe(true);
    }

    // Quando algum arquivo ainda está com recorded: false em um manifesto customizado
    const pendingManifest = {
      ...MERCY_AUDIO_MANIFEST,
      clips: Object.fromEntries(
        Object.entries(MERCY_AUDIO_MANIFEST.clips).map(([k, v]) => [
          k,
          { ...v, recorded: false },
        ]),
      ),
    };
    expect(areMercyRecordingsIntegrated(pendingManifest)).toBe(false);
    expect(
      resolveMercyAudio({ prayer: "pai", text: "Texto adulterado" }),
    ).toBeNull();
    expect(narrationForMercyStep(null)).toBe("");
  });
});

describe("Terço da Divina Misericórdia — Reprodutor e Avanço Automático", () => {
  test("início, pausa e retomada respeitam a posição exata sem reiniciar indevidamente a oração", async () => {
    const { controller, media, storage, scope, steps, advance, loadStep } =
      createHarness(3);

    // Nunca inicia automaticamente antes do clique do usuário
    expect(media.play).not.toHaveBeenCalled();
    expect(controller.mode).toBe("continuous");

    // Início explícito pelo usuário na etapa 3 (Credo)
    await controller.play();
    expect(media.play).toHaveBeenCalledTimes(1);
    expect(media.src).toBe("/audio/misericordia/04-credo.mp3");
    expect(controller.state.status).toBe("playing");

    // Avança o tempo dentro da etapa 3 e pausa
    media.currentTime = 15.6;
    controller.pause();
    expect(controller.state.status).toBe("paused");
    expect(media.pause).toHaveBeenCalled();
    expect(advance).not.toHaveBeenCalled();

    const clip = resolveMercyAudio(steps[3]);
    expect(readMercyCheckpoint(storage, scope, steps[3].id, clip.id).time).toBe(
      15.6,
    );

    // Recarregar a mesma etapa preserva a posição atual da reprodução (15.6s)
    loadStep(3, false);
    expect(controller.state.status).toBe("paused");
    expect(controller.state.time).toBe(15.6);

    // Retomar continua exatamente de 15.6s, sem zerar para 0 e sem voltar à etapa 0
    await controller.play();
    expect(media.currentTime).toBe(15.6);
    expect(controller.state.status).toBe("playing");
  });

  test("avança automaticamente de uma etapa para a seguinte após o clique inicial, incluindo contas repetidas da dezena", async () => {
    const { controller, media, getPosition } = createHarness(0);

    await controller.play();
    expect(getPosition()).toBe(0);
    expect(media.src).toBe("/audio/misericordia/01-sinal-da-cruz.mp3");

    // Conclui Sinal da Cruz (0) -> Pai-Nosso (1) -> Ave-Maria (2) -> Credo (3) -> 1ª Dezena Eterno Pai (4) -> 1ª conta (5) -> 2ª conta (6)
    for (let expectedNext = 1; expectedNext <= 6; expectedNext++) {
      media.currentTime = 12;
      media.ended = true;
      media.fire("ended");
      media.ended = false;
      expect(getPosition()).toBe(expectedNext);
    }

    // Na transição da 1ª conta pequena (5) para a 2ª conta pequena (6), o mesmo arquivo é reutilizado mas currentTime volta a 0
    expect(media.src).toBe(
      "/audio/misericordia/06-pela-sua-dolorosa-paixao.mp3",
    );
    expect(media.currentTime).toBe(0);
  });

  test("avanço e retorno manuais invalidam o áudio anterior e não deixam múltiplos áudios tocando", async () => {
    const { controller, media, advance, loadStep, getPosition } =
      createHarness(4);

    await controller.play();
    expect(controller.wanted).toBe(true);
    const oldListeners = [...controller.listeners];

    // Usuário avança manualmente para a etapa 5 enquanto o áudio da etapa 4 tocava
    loadStep(5, true);
    expect(getPosition()).toBe(5);

    // Se o evento ended antigo disparar tardiamente, ele é ignorado e não avança duas vezes
    const staleEnded = oldListeners.find(([name]) => name === "ended")[1];
    media.ended = true;
    staleEnded();
    media.ended = false;
    expect(advance).not.toHaveBeenCalled();
    expect(getPosition()).toBe(5);

    // Usuário retorna manualmente para a etapa 2 com o áudio pausado
    controller.pause();
    loadStep(2, false);
    expect(getPosition()).toBe(2);
    expect(controller.wanted).toBe(false);
    expect(controller.state.status).toBe("idle");
  });

  test("quando um áudio falha ao carregar ou reproduzir, registra estado de erro e não avança automaticamente", async () => {
    const { controller, media, advance, getPosition } = createHarness(0);

    // Falha na promessa de play() (ex.: arquivo ausente / erro de rede)
    media.play.mockRejectedValueOnce(new Error("Network error"));
    await controller.play();
    expect(controller.state.status).toBe("error");
    expect(controller.wanted).toBe(false);
    expect(advance).not.toHaveBeenCalled();
    expect(getPosition()).toBe(0);

    // Bloqueio de autoplay pelo navegador (NotAllowedError)
    media.play.mockRejectedValueOnce(
      Object.assign(new Error("Autoplay blocked"), {
        name: "NotAllowedError",
      }),
    );
    await controller.play();
    expect(controller.state.status).toBe("blocked");
    expect(advance).not.toHaveBeenCalled();

    // Evento de erro da mídia durante o carregamento
    await controller.play();
    media.fire("error");
    expect(controller.state.status).toBe("error");
    expect(controller.wanted).toBe(false);
    expect(advance).not.toHaveBeenCalled();
  });

  test("encerramento da oração após a última etapa transita para o estado complete e pausa a mídia", async () => {
    const { controller, media, getPosition } = createHarness(62, {
      closingPrayer: true,
    });

    await controller.play();
    expect(getPosition()).toBe(62);
    expect(media.src).toBe("/audio/misericordia/08-oracao-conclusiva.mp3");

    media.ended = true;
    media.fire("ended");

    expect(getPosition()).toBe(63);
    expect(controller.state.status).toBe("complete");
    expect(controller.wanted).toBe(false);
    expect(media.removeAttribute).toHaveBeenCalledWith("src");
  });

  test("checkpoints inválidos ou armazenamento bloqueado são tratados com segurança", () => {
    const { storage, scope } = createHarness(0);
    writeMercyCheckpoint(storage, scope, {
      stepId: "0-sinal",
      clipId: "clip-1",
      time: -5,
    });
    expect(readMercyCheckpoint(storage, scope, "0-sinal", "clip-1")).toBeNull();

    const blockedStorage = {
      getItem() {
        throw new Error("Blocked");
      },
      setItem() {
        throw new Error("Blocked");
      },
    };
    expect(
      readMercyCheckpoint(blockedStorage, scope, "0-sinal", "clip-1"),
    ).toBeNull();
    expect(writeMercyCheckpoint(blockedStorage, scope, {})).toBe(false);
  });
});
