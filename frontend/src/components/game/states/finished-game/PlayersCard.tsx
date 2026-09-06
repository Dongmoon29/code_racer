import { Crown, UserRound } from "lucide-react";

export interface ResultPlayer {
  id: string;
  name: string;
  rating?: number;
  delta?: number;
  isWinner: boolean;
}

interface PlayersCardProps {
  players: ResultPlayer[];
  currentUserId?: string;
  showRatingDelta: boolean;
}

function formatRatingDelta(delta: number): string {
  return `${delta >= 0 ? "+" : ""}${delta}`;
}

export function PlayersCard({
  players,
  currentUserId,
  showRatingDelta,
}: PlayersCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]/70 p-4 shadow-lg backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gray-11)]">
        <UserRound className="h-4 w-4" />
        Players
      </div>
      <div className="space-y-2">
        {players.map((player) => {
          const isCurrentUser = player.id === currentUserId;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between gap-4 rounded-xl border p-3 ${
                player.isWinner
                  ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                  : "border-[var(--gray-6)] bg-[var(--gray-2)]/50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    player.isWinner
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-[var(--gray-4)] text-[var(--gray-11)]"
                  }`}
                >
                  {player.isWinner ? (
                    <Crown className="h-4 w-4" />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[var(--color-text)]">
                    {player.name}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--gray-11)]">
                    {player.isWinner ? "Winner" : "Participant"}
                    {isCurrentUser ? " · You" : ""}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-[var(--color-text)]">
                  {typeof player.rating === "number" ? player.rating : "—"}
                </div>
                {showRatingDelta && typeof player.delta === "number" ? (
                  <div
                    className={`mt-0.5 text-xs font-semibold ${
                      player.delta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatRatingDelta(player.delta)} rating
                  </div>
                ) : (
                  <div className="mt-0.5 text-xs text-[var(--gray-10)]">
                    Rating
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--gray-6)] p-4 text-sm text-[var(--gray-11)]">
            Player details are unavailable.
          </div>
        ) : null}
      </div>
    </section>
  );
}
