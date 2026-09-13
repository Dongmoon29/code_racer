package service

import (
	"fmt"
	"math"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
)

// ratingService owns rating policy and coordinates its persistence. Match
// lifecycle and submission code do not need to know how ELO is calculated.
type ratingService struct {
	matches repository.MatchRepository
	users   interfaces.UserRepository
	logger  logger.Logger
}

func newRatingService(matches repository.MatchRepository, users interfaces.UserRepository, appLogger logger.Logger) *ratingService {
	return &ratingService{matches: matches, users: users, logger: appLogger}
}

func (s *ratingService) UpdateForWinner(matchID, winnerID uuid.UUID) {
	match, err := s.matches.FindByID(matchID)
	if err != nil || match == nil || match.Mode != model.MatchModeRankedPVP || match.PlayerBID == nil {
		return
	}

	loserID := match.PlayerAID
	if winnerID == match.PlayerAID {
		loserID = *match.PlayerBID
	}

	winner, winnerErr := s.users.FindByID(winnerID)
	loser, loserErr := s.users.FindByID(loserID)
	if winnerErr != nil || loserErr != nil || winner == nil || loser == nil {
		s.logger.Warn().Err(fmt.Errorf("failed to load users for ELO update")).Msg("Failed to update ELO ratings")
		return
	}

	winnerOld, loserOld := winner.Rating, loser.Rating
	winnerNew, loserNew := applyElo(winnerOld, loserOld, true)
	if err := s.matches.ApplyRatingDeltas(matchID, winnerID, loserID, winnerNew-winnerOld, loserNew-loserOld); err != nil {
		s.logger.Warn().Err(err).Msg("Failed to update ELO ratings")
	}
}

// applyElo applies ELO update with K-factor to winner/loser ratings.
func applyElo(winnerRating int, loserRating int, winnerWon bool) (int, int) {
	const kFactor = 32.0
	ra := float64(winnerRating)
	rb := float64(loserRating)
	ea := 1.0 / (1.0 + math.Pow(10.0, (rb-ra)/400.0))
	eb := 1.0 - ea
	var sa, sb float64
	if winnerWon {
		sa, sb = 1.0, 0.0
	} else {
		sa, sb = 0.0, 1.0
	}
	newRA := int(math.Round(ra + kFactor*(sa-ea)))
	newRB := int(math.Round(rb + kFactor*(sb-eb)))
	if newRA < 0 {
		newRA = 0
	}
	if newRB < 0 {
		newRB = 0
	}
	return newRA, newRB
}
