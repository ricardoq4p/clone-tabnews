import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import imageCompression from "browser-image-compression";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [avatar, setAvatar] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [calorieDescription, setCalorieDescription] = useState("");
  const [calorieGoal, setCalorieGoal] = useState(1200);
  const [calorieData, setCalorieData] = useState({
    entries: [],
    goal: 1200,
    totalCalories: 0,
    remainingCalories: 1200,
  });
  const [caloriesLoading, setCaloriesLoading] = useState(true);
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const [calorieError, setCalorieError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/login");
  }, [router, session, status]);

  useEffect(() => {
    if (!session) return;

    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        if (data?.avatar) {
          setAvatar(data.avatar);
        }
        setCalorieGoal(data?.calorieGoal || 1200);
      })
      .catch((err) => console.error("Erro ao carregar perfil:", err));
  }, [session]);

  useEffect(() => {
    if (!session) return;

    setCaloriesLoading(true);
    fetch("/api/calories")
      .then((res) => res.json())
      .then((data) => {
        setCalorieData({
          entries: Array.isArray(data?.entries) ? data.entries : [],
          goal: data?.goal || 1200,
          totalCalories: data?.totalCalories || 0,
          remainingCalories: data?.remainingCalories ?? 1200,
        });
        setCalorieGoal(data?.goal || 1200);
      })
      .catch((err) => {
        console.error("Erro ao carregar calorias:", err);
        setCalorieError("Nao foi possivel carregar o contador secreto.");
      })
      .finally(() => setCaloriesLoading(false));
  }, [session]);

  const progressPercentage = useMemo(() => {
    const goal = calorieData.goal || 1200;
    const total = calorieData.totalCalories || 0;

    return Math.min(100, Math.round((total / goal) * 100));
  }, [calorieData.goal, calorieData.totalCalories]);

  if (status === "loading" || !session) return null;

  const handleImage = async (file) => {
    if (!file) return;

    try {
      setUploading(true);

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 512,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      const imageUrl = data.secure_url;

      await fetch("/api/users/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      setAvatar(imageUrl);
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleCalorieSubmit = async (e) => {
    e.preventDefault();

    if (!calorieDescription.trim() || entrySubmitting) return;

    try {
      setEntrySubmitting(true);
      setCalorieError("");

      const res = await fetch("/api/calories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: calorieDescription }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Nao foi possivel registrar o alimento.");
      }

      setCalorieData({
        entries: data.entries,
        goal: data.goal,
        totalCalories: data.totalCalories,
        remainingCalories: data.remainingCalories,
      });
      setCalorieDescription("");
    } catch (error) {
      setCalorieError(error.message || "Nao foi possivel registrar o alimento.");
    } finally {
      setEntrySubmitting(false);
    }
  };

  const handleGoalSave = async () => {
    try {
      setGoalSaving(true);
      setCalorieError("");

      const res = await fetch("/api/calories/goal", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal: calorieGoal }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Nao foi possivel atualizar a meta.");
      }

      setCalorieData((current) => ({
        ...current,
        goal: data.goal,
        remainingCalories: data.goal - current.totalCalories,
      }));
    } catch (error) {
      setCalorieError(error.message || "Nao foi possivel atualizar a meta.");
    } finally {
      setGoalSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      setCalorieError("");

      const res = await fetch("/api/calories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Nao foi possivel remover o registro.");
      }

      setCalorieData({
        entries: data.entries,
        goal: data.goal,
        totalCalories: data.totalCalories,
        remainingCalories: data.remainingCalories,
      });
    } catch (error) {
      setCalorieError(error.message || "Nao foi possivel remover o registro.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="glass-panel mb-6 rounded-[28px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                Perfil privado
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Seu espaco pessoal</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Atualize sua foto, acompanhe seus dados e, se encontrar o canto secreto, registre suas refeicoes do dia com estimativas de calorias.
              </p>
            </div>

            <button onClick={() => router.push("/feed")} className="secondary-button rounded-full px-4 py-2 text-sm">
              Voltar para o feed
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <section className="glass-panel rounded-[28px] p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${session?.user?.name}`}
                alt="avatar"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-cyan-400/20"
              />

              <h2 className="mt-5 text-2xl font-semibold text-white">
                {profileData?.name || session.user.name}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{profileData?.email || session.user.email}</p>

              <label className="mt-6 w-full text-left text-sm text-slate-300">
                <span className="mb-2 block">Trocar foto de perfil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                  className="field-input cursor-pointer file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-200"
                />
              </label>

              {uploading ? <p className="mt-3 text-sm text-cyan-200">Enviando nova imagem...</p> : null}
            </div>
          </section>

          <section className="glass-panel rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Easter egg</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Contador secreto de calorias</h2>
              </div>
              <button
                onClick={() => setSecretOpen((current) => !current)}
                className="secondary-button rounded-full px-4 py-2 text-sm"
              >
                {secretOpen ? "Fechar" : "Abrir"}
              </button>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Privado e so visivel para voce. Escreva o que comeu em texto livre, receba uma estimativa de calorias e acompanhe quanto falta para a sua meta diaria.
            </p>

            {secretOpen ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 rounded-[24px] border border-white/10 bg-slate-950/30 p-4 sm:grid-cols-[1fr,auto] sm:items-end">
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Meta diaria</span>
                    <input
                      type="number"
                      min="300"
                      max="6000"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(Number(e.target.value))}
                      className="field-input"
                    />
                  </label>

                  <button onClick={handleGoalSave} disabled={goalSaving} className="primary-button px-5 py-3">
                    {goalSaving ? "Salvando..." : "Salvar meta"}
                  </button>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Consumido hoje</p>
                      <p className="mt-1 text-3xl font-semibold text-white">{calorieData.totalCalories} kcal</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-slate-400">Meta do dia</p>
                      <p className="mt-1 text-xl font-semibold text-cyan-200">{calorieData.goal} kcal</p>
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-300 transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    {calorieData.remainingCalories >= 0
                      ? `Faltam ${calorieData.remainingCalories} kcal para a meta.`
                      : `Voce passou ${Math.abs(calorieData.remainingCalories)} kcal da meta.`}
                  </p>
                </div>

                <form onSubmit={handleCalorieSubmit} className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">O que voce comeu hoje?</span>
                    <textarea
                      value={calorieDescription}
                      onChange={(e) => setCalorieDescription(e.target.value)}
                      placeholder="Ex.: pao com ovo e cafe com leite"
                      className="field-input min-h-[120px] resize-y"
                    />
                  </label>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                      Valores estimados com base em porcoes comuns. Isso e apenas informativo e nao substitui orientacao nutricional.
                    </p>
                    <button type="submit" disabled={entrySubmitting} className="primary-button px-5 py-3">
                      {entrySubmitting ? "Registrando..." : "Registrar refeicao"}
                    </button>
                  </div>
                </form>

                {calorieError ? (
                  <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {calorieError}
                  </p>
                ) : null}

                <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Hoje</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">Diario privado</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
                      {calorieData.entries.length} registros
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {caloriesLoading ? (
                      <p className="text-sm text-slate-500">Carregando registros...</p>
                    ) : calorieData.entries.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Nenhuma refeicao registrada hoje. O segredo esta pronto para o primeiro item.
                      </p>
                    ) : (
                      calorieData.entries.map((entry) => (
                        <article
                          key={entry._id}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-medium text-white">{entry.description}</p>
                              <p className="mt-1 text-sm text-cyan-200">{entry.estimatedCalories} kcal estimadas</p>
                            </div>
                            <button
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="secondary-button rounded-full px-4 py-2 text-sm"
                            >
                              Remover
                            </button>
                          </div>

                          {entry.matchedItems?.length ? (
                            <p className="mt-3 text-sm leading-6 text-slate-400">
                              Base da estimativa: {entry.matchedItems.join(", ")}
                            </p>
                          ) : null}

                          {entry.note ? (
                            <p className="mt-2 text-xs leading-5 text-slate-500">{entry.note}</p>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-slate-950/20 p-6 text-sm text-slate-500">
                O modo secreto fica aqui. Quando abrir, voce consegue definir sua meta, registrar refeicoes e acompanhar quanto ainda falta para o dia.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
