package service

import (
	"context"
	"errors"

	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// matchService is a small facade. Each workflow is implemented by a focused
// component so HTTP and WebSocket transports share one stable entry point.
type matchService struct {
	lifecycle     *matchLifecycleService
	submissions   *submissionService
	reconnections *reconnectionService
}

var _ interfaces.GameEngine = (*matchService)(nil)

type GameEngineDependencies struct {
	MatchRepository   repository.MatchRepository
	ProblemRepository repository.ProblemRepository
	Redis             *redis.Client
	Judge             interfaces.JudgeService
	Users             interfaces.UserRepository
	Logger            logger.Logger
	Broadcaster       interfaces.WebSocketBroadcaster
	Events            events.EventBus
}

func NewGameEngine(deps GameEngineDependencies) (interfaces.GameEngine, error) {
	if deps.MatchRepository == nil || deps.ProblemRepository == nil || deps.Redis == nil || deps.Judge == nil || deps.Users == nil || deps.Logger == nil {
		return nil, errors.New("game engine requires match/problem repositories, Redis, judge, users, and logger")
	}
	state := NewRedisManager(deps.Redis, deps.Logger)
	ratings := newRatingService(deps.MatchRepository, deps.Users, deps.Logger)
	reconnections := newReconnectionService(deps.MatchRepository, deps.Redis, state, deps.Events, deps.Logger)
	return &matchService{
		lifecycle:     newMatchLifecycleService(deps.MatchRepository, deps.ProblemRepository, deps.Redis, state, reconnections, deps.Events, deps.Logger),
		submissions:   newSubmissionService(deps.MatchRepository, deps.Judge, deps.Redis, state, ratings, deps.Logger, deps.Events, deps.Broadcaster),
		reconnections: reconnections,
	}, nil
}

func (s *matchService) Start(ctx context.Context) { s.reconnections.Start(ctx) }
func (s *matchService) Stop()                     { s.reconnections.Stop() }

func (s *matchService) Create(ctx context.Context, cmd game.CreateMatchCommand) (*model.Match, error) {
	return s.lifecycle.CreateMatch(ctx, cmd.PlayerAID, cmd.PlayerBID, string(cmd.Difficulty), string(cmd.Mode))
}

func (s *matchService) CreateSingle(ctx context.Context, cmd game.CreateSingleMatchCommand) (*model.Match, error) {
	return s.lifecycle.CreateSingle(ctx, cmd.PlayerID, string(cmd.Difficulty))
}

func (s *matchService) Get(_ context.Context, matchID uuid.UUID) (*model.Match, error) {
	return s.lifecycle.Get(matchID)
}

func (s *matchService) GetActive(_ context.Context, userID uuid.UUID) (*model.Match, error) {
	return s.lifecycle.GetActive(userID)
}

func (s *matchService) Close(ctx context.Context, cmd game.ParticipantCommand) error {
	return s.lifecycle.Close(ctx, cmd.MatchID, cmd.UserID)
}

func (s *matchService) Submit(ctx context.Context, cmd game.SubmitCommand) (*game.SubmissionResult, error) {
	return s.submissions.Submit(ctx, cmd)
}

func (s *matchService) UpdateCode(_ context.Context, cmd game.CodeSnapshotCommand) error {
	return s.submissions.UpdateCode(cmd.MatchID, cmd.UserID, cmd.Code, cmd.Language)
}

func (s *matchService) GetPlayerCode(_ context.Context, cmd game.ParticipantCommand) (string, error) {
	return s.submissions.GetPlayerCode(cmd.MatchID, cmd.UserID)
}

func (s *matchService) Connect(ctx context.Context, cmd game.ParticipantCommand) error {
	return s.reconnections.Connected(ctx, cmd.MatchID, cmd.UserID)
}

func (s *matchService) Disconnect(ctx context.Context, cmd game.ParticipantCommand) error {
	return s.reconnections.Disconnected(ctx, cmd.MatchID, cmd.UserID)
}
