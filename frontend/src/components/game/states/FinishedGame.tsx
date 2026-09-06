import React, { memo } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Clock3, Code2, Gauge, MemoryStick } from "lucide-react";
import { Game } from "@/types";
import { Button } from "../../ui/Button";
import { PlayersCard, type ResultPlayer } from "./finished-game/PlayersCard";
import { ResultStatCard } from "./finished-game/ResultStatCard";
import { SolutionPanel } from "./finished-game/SolutionPanel";

function formatMode(mode: Game["mode"]): string {
  switch (mode) {
    case "ranked_pvp":
      return "Ranked Match";
    case "casual_pvp":
      return "Casual Match";
    case "single":
      return "Solo Challenge";
    default:
      return String(mode);
  }
}

function difficultyClass(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-400";
    case "medium":
      return "border-amber-500/25 bg-amber-500/10 text-amber-400";
    case "hard":
      return "border-rose-500/25 bg-rose-500/10 text-rose-400";
    default:
      return "border-[var(--gray-6)] bg-[var(--gray-3)] text-[var(--gray-11)]";
  }
}

interface Props {
  game: Game;
  me?: { id: string; name: string };
  opponent?: { id: string; name: string };
  myCode: string;
  opponentCode: string;
  selectedLanguage: "python" | "javascript" | "go";
}

export const FinishedGame: React.FC<Props> = memo(
  ({ game, me, myCode, opponentCode, selectedLanguage }) => {
    const router = useRouter();

    const winnerId = game.winner?.id;
    const winnerIsMe = Boolean(winnerId && me?.id && winnerId === me.id);
    const isSingle = game.mode === "single";
    // Finished matches use the durable server snapshot. The local fallback keeps
    // result pages for matches completed before winner_code was introduced usable.
    const localWinnerCode =
      winnerIsMe || isSingle ? myCode : opponentCode || myCode;
    const winnerCode = game.winner_code?.trim()
      ? game.winner_code
      : localWinnerCode;
    const winnerLanguage = game.winner_language ?? selectedLanguage;

    const execSeconds = game.winner_execution_time_seconds;
    const memKB = game.winner_memory_usage_kb;
    const execLabel =
      typeof execSeconds === "number"
        ? `${Math.round(execSeconds * 1000)} ms`
        : "—";
    const execDetail =
      typeof execSeconds === "number"
        ? `${execSeconds.toFixed(3)} seconds`
        : "";
    const memLabel =
      typeof memKB === "number"
        ? memKB >= 1024
          ? `${(memKB / 1024).toFixed(2)} MB`
          : `${Math.round(memKB)} KB`
        : "—";
    const memDetail =
      typeof memKB === "number" && memKB >= 1024
        ? `${Math.round(memKB).toLocaleString()} KB`
        : "";

    const isRanked = game.mode === "ranked_pvp";
    const playerAIsWinner = Boolean(winnerId && game.playerA?.id === winnerId);
    const playerBIsWinner = Boolean(winnerId && game.playerB?.id === winnerId);

    const players: ResultPlayer[] = [
      game.playerA
        ? {
            id: game.playerA.id,
            name: game.playerA.name,
            rating: game.playerA.rating,
            delta: playerAIsWinner
              ? game.winner_rating_delta
              : game.loser_rating_delta,
            isWinner: playerAIsWinner,
          }
        : null,
      game.playerB
        ? {
            id: game.playerB.id,
            name: game.playerB.name,
            rating: game.playerB.rating,
            delta: playerBIsWinner
              ? game.winner_rating_delta
              : game.loser_rating_delta,
            isWinner: playerBIsWinner,
          }
        : null,
    ].filter((player): player is NonNullable<typeof player> => Boolean(player));

    return (
      <div className="relative h-full overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <main className="relative mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Solution accepted
          </h1>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]/70 p-4 shadow-lg backdrop-blur sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gray-11)]">
                      <Code2 className="h-4 w-4" />
                      Completed problem
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-[var(--color-text)] sm:text-2xl">
                      {game.problem.title}
                    </h2>
                  </div>
                  {game.problem.difficulty ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyClass(
                        game.problem.difficulty,
                      )}`}
                    >
                      {game.problem.difficulty}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-[var(--gray-6)] pt-3 text-sm text-[var(--gray-11)]">
                  <Gauge className="h-4 w-4" />
                  {formatMode(game.mode)}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <ResultStatCard
                  icon={Clock3}
                  label="Execution"
                  value={execLabel}
                  detail={execDetail}
                  tone="cyan"
                />
                <ResultStatCard
                  icon={MemoryStick}
                  label="Memory"
                  value={memLabel}
                  detail={memDetail}
                  tone="violet"
                />
              </section>

              <PlayersCard
                players={players}
                currentUserId={me?.id}
                showRatingDelta={isRanked}
              />

              <div>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="btn-neon h-11 w-full rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>

            <SolutionPanel code={winnerCode} language={winnerLanguage} />
          </div>
        </main>
      </div>
    );
  },
);

FinishedGame.displayName = "FinishedGame";
