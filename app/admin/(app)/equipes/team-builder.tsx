"use client";

import { startTransition, useActionState, useState } from "react";
import { Lock } from "lucide-react";
import type { FormState } from "@/app/(public)/moi/actions";
import { RadarChart, RadarLegend } from "@/components/admin/radar-chart";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { StatusMarker } from "@/components/ui/markers";
import type { BuilderPerson, BuilderTeam } from "@/lib/admin-queries";
import { COMPETITIONS, SPECIALITIES, specialityLabel, type Competition } from "@/lib/constants";
import { SKILL_AXES, SPECIALITY_AXES, capSeries, skillGroupValues, specialityValues } from "@/lib/radar";
import { formatMissing, teamBalance, teamComposition, type TeamBalance } from "@/lib/teams";
import { addMembers, createTeam, deleteTeam, removeMember, setTeamLock } from "./actions";

const fullName = (p: BuilderPerson) => `${p.first_name} ${p.last_name}`;
const tagsOf = (p: BuilderPerson) => p.specialities.map(specialityLabel).join(", ") || "—";
const kindsOf = (people: BuilderPerson[]) => people.map((p) => p.profile_kind);
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
/** Lower case without accents, so "elodie" finds "Élodie". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function verdict(b: TeamBalance): string {
  if (b.complete) return "complète";
  if (b.size > b.max) return `${plural(b.size - b.max, "membre", "membres")} en trop`;
  return `manque : ${formatMissing(b.missing)}`;
}

const TH = "py-2 pr-3 font-semibold";
const NUM = "tabular py-2.5 pr-3 text-right";
const FILTER_CHIP =
  "cursor-pointer border border-jade/30 bg-white px-3 py-1.5 text-small text-ink transition-colors duration-150 hover:border-jade has-checked:border-emerald has-checked:bg-mist has-checked:font-semibold has-checked:text-jade has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald";

export function TeamBuilder({
  competition,
  tab,
  teams,
  free,
}: {
  competition: Competition;
  tab: "equipes" | "libres";
  teams: BuilderTeam[];
  free: BuilderPerson[];
}) {
  // both selections live here so they survive a switch between the two tabs
  const [picked, setPicked] = useState<string[]>([]);
  const [openTeams, setOpenTeams] = useState<string[]>([]);
  return tab === "libres" ? (
    <FreePeople competition={competition} free={free} teams={teams} picked={picked} setPicked={setPicked} />
  ) : (
    <Teams competition={competition} teams={teams} open={openTeams} setOpen={setOpenTeams} />
  );
}

/** The two radars side by side, one polygon per person, under a shared legend. */
function Profiles({ people }: { people: BuilderPerson[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { shown, hidden } = capSeries(people);
  const names = shown.map(fullName);
  const found = shown.findIndex((p) => p.participation_id === activeId);
  const active = found === -1 ? null : found;
  return (
    <div className="on-dark bg-abyss p-5 text-mist">
      <div className="grid gap-6 md:grid-cols-2">
        <RadarChart
          title="Compétences"
          axes={SKILL_AXES}
          series={shown.map((p, i) => ({ name: names[i], values: skillGroupValues(p.skills) }))}
          active={active}
        />
        <RadarChart
          title="Profil principal"
          axes={SPECIALITY_AXES}
          series={shown.map((p, i) => ({ name: names[i], values: specialityValues(p.specialities) }))}
          active={active}
        />
      </div>
      <RadarLegend
        names={names}
        hidden={hidden}
        active={active}
        onActive={(i) => setActiveId(i === null ? null : shown[i].participation_id)}
      />
    </div>
  );
}

/** The four head counts and the balance verdict of a team, real or about to be. */
function Composition({ competition, people }: { competition: Competition; people: BuilderPerson[] }) {
  const info = COMPETITIONS[competition];
  const count = teamComposition(kindsOf(people));
  const balance = teamBalance(competition, kindsOf(people));
  const tiles: [string, number, string?][] = [
    ["Membres", count.members, `min. ${info.min}, max. ${info.max}`],
    ["Technique", count.tech],
    ["Bio-santé", count.health],
    ["Les deux", count.both],
  ];
  return (
    <div className="mt-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([label, value, note]) => (
          <div key={label} className="border border-jade/15 bg-paper px-4 py-3">
            <dt className="t-label text-graphite">{label}</dt>
            <dd className="tabular mt-1 text-2xl font-bold text-jade">
              {value}
              {note && <span className="ml-2 text-small font-normal text-graphite">{note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-semibold text-ink">
        <StatusMarker done={balance.complete}>Équilibre : {verdict(balance)}</StatusMarker>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ people without a team

function FreePeople({
  competition,
  free,
  teams,
  picked,
  setPicked,
}: {
  competition: Competition;
  free: BuilderPerson[];
  teams: BuilderTeam[];
  picked: string[];
  setPicked: (ids: string[]) => void;
}) {
  const info = COMPETITIONS[competition];
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"create" | "add">("create");
  const [name, setName] = useState("");
  const [lead, setLead] = useState("");
  const [teamId, setTeamId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, form: FormData) => {
      const result = await (form.get("mode") === "add" ? addMembers : createTeam)(competition, prev, form);
      if (result.ok) {
        setPicked([]);
        setName("");
      }
      return result;
    },
    { ok: false, errors: {} },
  );

  // in the order they were ticked: the first one is the default lead
  const selected = picked.flatMap((id) => free.find((p) => p.participation_id === id) ?? []);
  const needle = fold(q.trim());
  const visible = free.filter(
    (p) =>
      (tags.length === 0 || tags.some((t) => p.specialities.includes(t))) &&
      (!needle || fold(`${fullName(p)} ${p.institution} ${p.skills.join(" ")} ${p.seeking_note ?? ""}`).includes(needle)),
  );

  const joinable = teams.filter((t) => !t.locked && t.members.length < info.max);
  const target = mode === "add" ? joinable.find((t) => t.id === teamId) : undefined;
  // selected people first: they keep their colours when the target team changes
  const preview = [...selected, ...(target?.members ?? [])];
  const tooMany = preview.length > info.max;
  const leadId = selected.some((p) => p.participation_id === lead) ? lead : (selected[0]?.participation_id ?? "");

  return (
    <div className="mt-6">
      <div aria-live="polite">
        {state.message && (
          <div className="mb-6">
            <Alert tone={state.ok ? "success" : "error"} title={state.message} role={state.ok ? "status" : "alert"} />
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <p className="text-graphite">
          Coche des personnes pour comparer leurs profils, puis crée une équipe ou ajoute-les à une équipe existante.
        </p>
      ) : (
        <section aria-labelledby="selection-title" className="border border-jade/15 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="selection-title" className="t-subhead">
              {target
                ? `${target.name} après l'ajout`
                : plural(selected.length, "personne sélectionnée", "personnes sélectionnées")}
            </h2>
            <button type="button" onClick={() => setPicked([])} className="text-small font-semibold text-emerald underline underline-offset-4">
              Tout désélectionner
            </button>
          </div>
          <div className="mt-4">
            <Profiles people={preview} />
          </div>
          <Composition competition={competition} people={preview} />

          <form
            onSubmit={(e) => {
              // sent by hand: with action={...} React resets the form afterwards, and ticked boxes look unticked
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              startTransition(() => formAction(data));
            }}
            className="mt-6 grid gap-5 border-t border-jade/15 pt-5"
          >
            {selected.map((p) => (
              <input key={p.participation_id} type="hidden" name="members" value={p.participation_id} />
            ))}
            <fieldset>
              <legend className="font-semibold text-ink">Que faire de cette sélection ?</legend>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {(
                  [
                    ["create", "Créer une équipe"],
                    ["add", "Ajouter à une équipe existante"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-ink">
                    <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="size-4" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {mode === "create" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team_name" className="block font-semibold text-ink">
                    Nom de l&apos;équipe
                  </label>
                  <input id="team_name" name="name" value={name} onChange={(e) => setName(e.currentTarget.value)} maxLength={40} autoComplete="off" className="control mt-2" />
                </div>
                <div>
                  <label htmlFor="team_lead" className="block font-semibold text-ink">
                    Chef d&apos;équipe
                  </label>
                  <select id="team_lead" name="lead" value={leadId} onChange={(e) => setLead(e.currentTarget.value)} className="control mt-2">
                    {selected.map((p) => (
                      <option key={p.participation_id} value={p.participation_id}>
                        {fullName(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="sm:max-w-md">
                <label htmlFor="team_target" className="block font-semibold text-ink">
                  Équipe
                </label>
                <p id="team_target-hint" className="mt-0.5 text-small text-graphite">
                  Les équipes verrouillées ou complètes ne sont pas proposées.
                </p>
                <select id="team_target" name="team" value={target?.id ?? ""} onChange={(e) => setTeamId(e.currentTarget.value)} aria-describedby="team_target-hint" className="control mt-2">
                  <option value="">Choisir…</option>
                  {joinable.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.members.length}/{info.max})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tooMany ? (
              <Alert tone="error" title={`${preview.length} membres : une équipe en compte ${info.max} au maximum.`}>
                Retire des personnes de la sélection.
              </Alert>
            ) : (
              preview.length < info.min &&
              (mode === "create" || target) && (
                <Alert tone="info" title={`Il manquera ${plural(info.min - preview.length, "membre", "membres")} pour atteindre le minimum de ${info.min}.`}>
                  Tu peux confirmer et compléter l&apos;équipe plus tard.
                </Alert>
              )
            )}
            <div>
              <Button type="submit" disabled={pending || tooMany || (mode === "add" && !target)}>
                {pending ? "Enregistrement…" : "Confirmer"}
              </Button>
              <p className="mt-2 text-small text-graphite">
                {mode === "add"
                  ? "Les personnes ajoutées et le chef d'équipe reçoivent un email."
                  : "Les personnes placées reçoivent un email."}{" "}
                Seules les adresses confirmées sont prévenues.
              </p>
            </div>
          </form>
        </section>
      )}

      <div className="mt-8 grid gap-3 border-y border-jade/15 py-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-end">
        <div>
          <label htmlFor="free_q" className="block text-small font-semibold text-ink">
            Recherche
          </label>
          <input id="free_q" type="search" value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Nom, établissement, compétence, note" className="control mt-1 min-h-10! py-2!" />
        </div>
        <fieldset>
          <legend className="text-small font-semibold text-ink">
            Spécialités <span className="font-normal text-graphite">(au moins une de celles cochées)</span>
          </legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {SPECIALITIES.map((s) => (
              <label key={s.value} className={FILTER_CHIP}>
                <input type="checkbox" checked={tags.includes(s.value)} onChange={() => setTags(toggle(tags, s.value))} className="sr-only" />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="tabular mt-3 text-small text-graphite" aria-live="polite">
        {visible.length} sur {plural(free.length, "personne", "personnes")}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className="w-8 py-2 pr-3">
                <span className="sr-only">Sélection</span>
              </th>
              <th scope="col" className={TH}>Nom</th>
              <th scope="col" className={TH}>Profil principal</th>
              <th scope="col" className={TH}>Compétences</th>
              <th scope="col" className={TH}>Statut</th>
              <th scope="col" className="py-2 font-semibold">Note de recherche</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const boxId = `pick-${p.participation_id}`;
              return (
                <tr key={p.participation_id} className="border-b border-jade/10 align-top even:bg-mist/60">
                  <td className="py-2.5 pr-3">
                    <input id={boxId} type="checkbox" checked={picked.includes(p.participation_id)} onChange={() => setPicked(toggle(picked, p.participation_id))} className="mt-0.5 size-4" />
                  </td>
                  <td className="py-2.5 pr-3">
                    <label htmlFor={boxId} className="cursor-pointer font-semibold text-ink">
                      {fullName(p)}
                    </label>
                    <span className="block text-graphite">{p.institution}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-ink">{tagsOf(p)}</td>
                  <td className="py-2.5 pr-3 text-ink">{p.skills.join(", ") || "—"}</td>
                  <td className="py-2.5 pr-3 text-ink">
                    {p.person_status === "confirmed" ? "Confirmée" : "En attente de confirmation"}
                    <span className="block text-graphite">{p.seeking_team ? "Cherche une équipe" : "Sans équipe"}</span>
                  </td>
                  <td className="max-w-xs py-2.5 text-ink">{p.seeking_note ?? "—"}</td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-graphite">
                  {free.length === 0 ? "Tout le monde a une équipe dans cette compétition." : "Personne ne correspond à ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ teams

function Teams({
  competition,
  teams,
  open,
  setOpen,
}: {
  competition: Competition;
  teams: BuilderTeam[];
  open: string[];
  setOpen: (ids: string[]) => void;
}) {
  const info = COMPETITIONS[competition];
  const shown = teams.filter((t) => open.includes(t.id));
  return (
    <div className="mt-6">
      {shown.length === 0 ? (
        <p className="text-graphite">Coche une équipe pour voir les profils de ses membres et la modifier.</p>
      ) : (
        <div className="grid gap-6">
          {shown.map((t) => (
            <TeamPanel key={t.id} competition={competition} team={t} />
          ))}
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className="w-8 py-2 pr-3">
                <span className="sr-only">Sélection</span>
              </th>
              <th scope="col" className={TH}>Équipe</th>
              <th scope="col" className={TH}>Code</th>
              <th scope="col" className={`${TH} text-right`}>Taille</th>
              <th scope="col" className={`${TH} text-right`}>Technique</th>
              <th scope="col" className={`${TH} text-right`}>Bio-santé</th>
              <th scope="col" className={`${TH} text-right`}>Les deux</th>
              <th scope="col" className={TH}>Équilibre</th>
              <th scope="col" className="py-2 font-semibold">Verrou</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const boxId = `team-${t.id}`;
              const count = teamComposition(kindsOf(t.members));
              const balance = teamBalance(competition, kindsOf(t.members));
              return (
                <tr key={t.id} className="border-b border-jade/10 even:bg-mist/60">
                  <td className="py-2.5 pr-3">
                    <input id={boxId} type="checkbox" checked={open.includes(t.id)} onChange={() => setOpen(toggle(open, t.id))} className="size-4 align-middle" />
                  </td>
                  <td className="py-2.5 pr-3">
                    <label htmlFor={boxId} className="cursor-pointer font-semibold text-ink">
                      {t.name}
                    </label>
                  </td>
                  <td className="tabular py-2.5 pr-3 text-graphite">{t.join_code}</td>
                  <td className={NUM}>
                    <span className="font-semibold text-ink">{count.members}</span>
                    <span className="text-graphite">
                      {" "}
                      / {info.min}–{info.max}
                    </span>
                  </td>
                  <td className={NUM}>{count.tech}</td>
                  <td className={NUM}>{count.health}</td>
                  <td className={NUM}>{count.both}</td>
                  <td className="py-2.5 pr-3 text-ink">
                    <StatusMarker done={balance.complete}>{verdict(balance)}</StatusMarker>
                  </td>
                  <td className="py-2.5 text-ink">
                    {t.locked ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-jade">
                        <Lock aria-hidden className="size-4" strokeWidth={1.75} /> Verrouillée
                      </span>
                    ) : (
                      <span className="text-graphite">Ouverte</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-graphite">
                  Aucune équipe dans cette compétition.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamPanel({ competition, team }: { competition: Competition; team: BuilderTeam }) {
  const titleId = `panel-${team.id}`;
  return (
    <section aria-labelledby={titleId} className="border border-jade/15 bg-white p-5">
      <h2 id={titleId} className="t-subhead">
        {team.name}
        <span className="tabular ml-3 text-small font-normal text-graphite">{team.join_code}</span>
        {team.locked && (
          <span className="ml-3 inline-flex items-center gap-1.5 text-small font-semibold text-jade">
            <Lock aria-hidden className="size-4" strokeWidth={1.75} /> Verrouillée
          </span>
        )}
      </h2>
      {team.members.length > 0 && (
        <div className="mt-4">
          <Profiles people={team.members} />
        </div>
      )}
      <Composition competition={competition} people={team.members} />

      <ul className="mt-5 border-b border-jade/15">
        {team.members.map((m) => (
          <li key={m.participation_id} className="flex flex-wrap items-center justify-between gap-3 border-t border-jade/15 py-3">
            <div>
              <p className="font-semibold text-ink">
                {fullName(m)}
                {m.participation_id === team.lead_participation_id && (
                  <span className="ml-2 text-small font-semibold text-jade">Chef d&apos;équipe</span>
                )}
              </p>
              <p className="text-small text-graphite">
                {tagsOf(m)} · {m.institution}
                {m.person_status === "pending" && " · email non confirmé"}
              </p>
            </div>
            {!team.locked && (
              <SimpleActionForm action={removeMember.bind(null, m.participation_id)} submitLabel="Retirer" variant="secondary" size="sm" pendingLabel="…" />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">{team.locked ? "Équipe verrouillée" : "Verrouiller l'équipe"}</h3>
          <p className="mt-1 text-small text-graphite">
            Une équipe verrouillée ne peut plus être modifiée, ni par ses membres ni depuis cette page. Déverrouille-la
            pour ajouter ou retirer quelqu&apos;un.
          </p>
          <div className="mt-3">
            <SimpleActionForm
              action={setTeamLock.bind(null, team.id, !team.locked)}
              submitLabel={team.locked ? "Déverrouiller" : "Verrouiller"}
              variant="secondary"
              size="sm"
            />
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Supprimer l&apos;équipe</h3>
          {team.has_submission ? (
            <p className="mt-1 text-small text-graphite">Cette équipe a déposé un projet : elle ne peut pas être supprimée.</p>
          ) : team.locked ? (
            <p className="mt-1 text-small text-graphite">Déverrouille l&apos;équipe pour pouvoir la supprimer.</p>
          ) : (
            <>
              <p className="mt-1 text-small text-graphite">
                Ses membres restent inscrits à la compétition et repassent en recherche d&apos;équipe. Ils ne sont pas prévenus.
              </p>
              <div className="mt-3">
                <SimpleActionForm action={deleteTeam.bind(null, team.id)} submitLabel="Supprimer l'équipe" pendingLabel="Suppression…" variant="danger" size="sm">
                  <Checkbox name="confirm" id={`delete-${team.id}`}>
                    Supprimer {team.name} et libérer {plural(team.members.length, "membre", "membres")}.
                  </Checkbox>
                </SimpleActionForm>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
