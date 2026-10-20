# Rosário guiado por voz — protótipo local

Base: `b88e95e`, branch `feature/rosary-audio-prototype`. O usuário autorizou a
publicação desta demonstração em 20/10/2026. Não há migração de dados nem
contratação de voz. A cobertura parcial continua explícita na interface.

## Avaliar

Use Node 22 e as dependências do lockfile. Habilite explicitamente
`NEXT_PUBLIC_ROSARY_AUDIO_DEMO=true` no processo local e execute o servidor.
No checkout desta avaliação, o endereço é `http://127.0.0.1:3131/rosario`.

O comando `powershell -File scripts/start-rosary-audio-demo.ps1` inicia uma sessão
local com Node 22, banco desconectado e email desabilitado. O script não copia
credenciais, não edita arquivos de ambiente e não publica a aplicação.

1. Escolha os Mistérios Gozosos e comece a oração.
2. Ative **Rezar com áudio** e toque em **Reproduzir áudio**.
3. Escolha avanço manual ou contínuo e uma das velocidades: 1×, 1,25×, 1,5× e 2×.
4. Para ouvir a meditação da Anunciação sem percorrer as orações iniciais, use
   Próxima até a etapa 9. Essa navegação é a navegação normal do roteiro.
5. Pause, altere a velocidade e recarregue para avaliar a retomada. Depois de
   recarregar, escolha Continuar oração e reative o áudio; ele não inicia sozinho.

O pacote contém as dez orações distintas do roteiro e a meditação da Anunciação.
Os arquivos de Pai-Nosso e Ave-Maria são reutilizados nas contas correspondentes.
Ao chegar a um mistério ainda sem gravação, a reprodução contínua para e informa
a indisponibilidade. Não há salto silencioso ou substituição por outra meditação.
O modo tradicional continua disponível e é o padrão.

## Voz e pausas

Voz da demonstração: **Kokoro pm_santa**, português brasileiro, gerada localmente
por Kokoro ONNX. A publicação do pacote demonstrativo foi autorizada pelo usuário;
isso não representa escolha definitiva de fornecedor ou de voz para o catálogo
completo. Naturalidade, pronúncia e adequação espiritual permanecem sujeitas à
avaliação editorial.
As transcrições usam os textos já existentes, sem gerar conteúdo devocional novo.

Síntese a 0,88 do ritmo padrão do modelo, pausas entre frases e 2,2 segundos de
silêncio ao final das orações. A Anunciação inclui oito segundos de silêncio ao
final da meditação. Esses silêncios integram a mídia: pausa, retomada e velocidade
se aplicam a eles também. A 2×, por exemplo, o silêncio de oito segundos dura
quatro segundos. A interface identifica o intervalo contemplativo.

Modelo e vozes: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
Modelo original e licença declarada Apache-2.0: https://huggingface.co/hexgrad/Kokoro-82M
Vozes brasileiras: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
Runtime de geração MIT: https://github.com/thewh1teagle/kokoro-onnx

O modelo não é enviado ao navegador nem incluído nas dependências da aplicação.
O navegador recebe apenas MP3. Não há API de síntese em tempo real, voz do sistema,
requisição de microfone ou envio de dados pessoais ao gerador.

## Coordenação e retomada

`buildRosary()` continua produzindo a sequência oficial. `progress.position`
continua sendo a posição única das orações, texto, mistério e contas. O controlador
de áudio solicita avanço condicionado à posição e à identidade da oração atuais.
Ele invalida eventos antigos antes da transição e consome cada término uma vez.

Modo manual: termina a gravação e aguarda; Ouvir novamente repete a mesma etapa.
Modo contínuo: o evento real `ended`, após o silêncio, avança uma etapa. Relógios,
carregamento de rede e troca de velocidade nunca avançam o roteiro.

Anterior, Próxima e seleção de contas interrompem a reprodução anterior antes de
navegar. Se estava reproduzindo, continua na etapa de destino; se estava pausado,
permanece pausado. A etapa de destino começa do início. Trocar de conta, reiniciar
uma oração, resolver conflito ou sair da tela interrompe a reprodução automática.

O marcador de áudio é salvo localmente por oração/conta, etapa e pacote de voz.
Salva segundos, conclusão da gravação, modo e velocidade. Recarregar ou habilitar
áudio não dispara reprodução. O tempo é salvo aproximadamente a cada dois segundos,
ao pausar, navegar e no evento pagehide. Fechamento abrupto pode perder o pequeno
intervalo desde o último marcador; armazenamento bloqueado é informado na interface.

O identificador local `runId` fica no envelope local do progresso, fora do objeto
enviado à API. Envelopes antigos sem esse campo continuam aceitos. O schema MongoDB
e os endpoints existentes não foram modificados. Segundos de áudio não sincronizam
entre dispositivos; o progresso de etapas mantém a sincronização existente.

O catálogo confere o texto narrável exato. Textos editados sem gravação correspondente
permanecem disponíveis no modo tradicional. Trocar a voz exige um pacote com outro
identificador, invalidando segundos antigos sem alterar a posição da oração.

## Gerar novamente

Ferramentas opcionais, fora do runtime da aplicação:

```powershell
node scripts/prepare-rosary-demo.mjs
python -m venv .qa/audio-tools
.qa/audio-tools/Scripts/python -m pip install -r scripts/rosary-audio-requirements.txt
# Baixe modelo e voices-v1.0.bin da release indicada acima para uma pasta local.
.qa/audio-tools/Scripts/python scripts/generate-rosary-demo.py CAMINHO_DO_MODELO
node scripts/validate-rosary-audio.cjs
```

O script reutiliza arquivos de uma geração anterior somente quando texto, pausas,
voz e hash do arquivo conferem com o manifesto. Textos ou vozes diferentes exigem
geração nova. O identificador usado na retomada inclui o hash do arquivo para que
uma gravação substituída nunca herde os segundos da anterior.

## Opções de voz e custos consultados em 20/10/2026

Nenhum serviço pago foi utilizado ou contratado. O protótipo tem 2.899 caracteres
distintos de narração, reutilizando as orações repetidas.

| Alternativa                      | Referência por milhão de caracteres      | Uma geração de 2.899 caracteres |
| -------------------------------- | ---------------------------------------- | ------------------------------- |
| Kokoro local, usado no protótipo | Sem cobrança de API; usa a máquina local | US$ 0 de API                    |
| Amazon Polly Neural              | US$ 16                                   | Aproximadamente US$ 0,046       |
| Google Chirp 3 HD                | US$ 30                                   | Aproximadamente US$ 0,087       |
| Locução humana brasileira        | Orçamento com narrador e edição          | A cotar                         |

Valores de geração, antes de impostos, possíveis franquias, regravações e custos
de armazenamento/transferência. A qualidade final deve ser escolhida por amostras,
não pelo nome do fornecedor. Um catálogo completo deve ser orçado pelos textos
distintos aprovados; número de fiéis e repetições de Ave-Maria não multiplicam a
geração quando os arquivos são reutilizados, mas afetam a distribuição.

Fontes: https://aws.amazon.com/polly/pricing/ e
https://cloud.google.com/text-to-speech/pricing . Contratação e uso de serviços
pagos dependem de autorização específica após a avaliação das opções.

## Verificação

Testes unitários cobrem pausa, velocidades, retomada, conclusão manual/contínua,
eventos duplicados e antigos, troca de contexto, erros e armazenamento bloqueado.
`scripts/rosary-audio-browser-qa.cjs` executa somente contra localhost e intercepta
APIs; usa MP3 reais e verifica controles, retomada, navegação e larguras 1440/390/320.
Resultados e capturas ficam em `.qa/audio/`, ignorado pelo Git.

Safari/iPhone, Chrome/Android físicos, interrupções por chamada e reprodução com
tela bloqueada ainda precisam de homologação em dispositivos reais. Não há promessa
de execução contínua em segundo plano ou de disponibilidade offline do catálogo.
A interface opcional de demonstração fica disponível por padrão. Para desabilitá-la,
configure `NEXT_PUBLIC_ROSARY_AUDIO_DEMO=false` e gere um novo build. A ausência de
configuração não inicia reprodução; o fiel ainda precisa habilitar e reproduzir.

## Resultado desta avaliação

- Node 22.23.3, Windows e Chromium via Chrome instalado.
- 203 testes em 31 suítes aprovados; ESLint global e Prettier aprovados.
- Build otimizado aprovado com `next build --webpack` e flag de áudio habilitada.
  Webpack foi usado por causa da junção local de dependências de outro checkout
  com lockfile idêntico; o Turbopack rejeitou essa junção. Não houve alteração da
  configuração de build versionada do projeto.
- 11 MP3, aproximadamente 254 segundos e 1,4 MB; arquivos e hashes conferidos.
- Oito verificações integradas de navegador aprovadas, incluindo pausa/velocidades,
  retomada, modos de avanço, conta simulada, salvamento atrasado e modo tradicional.
- Sem erros JavaScript capturados, sem rolagem horizontal em 1440/390/320 px e sem
  violações axe no painel de áudio. Capturas inspecionadas visualmente.
- Voz ainda sujeita à avaliação auditiva do usuário; testes automatizados não
  certificam pronúncia ou adequação espiritual.

Relatório de navegador: `.qa/audio/browser-report.json`. Capturas:
`.qa/audio/player-1440.png`, `player-390.png` e `player-320.png`.
Os resultados acima descrevem a validação local inicial. A publicação autorizada
deve passar por CI, implantação do commit de main e verificação pública do domínio.
