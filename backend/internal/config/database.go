package config

import (
	"fmt"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/seed"
	"github.com/Dongmoon29/code_racer/internal/util"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func SetupDatabase(db *gorm.DB) error {
	operations := []struct {
		name string
		fn   func() error
	}{
		{"Enable UUID extension", func() error {
			return db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";").Error
		}},
		{"Auto migrate", func() error {
			return db.AutoMigrate(&model.User{}, &model.Game{}, &model.LeetCode{})
		}},
		{"Seed data", func() error {
			return seed.SeedLeetCodeProblem(db)
		}},
	}

	for _, op := range operations {
		if err := op.fn(); err != nil {
			return fmt.Errorf("%s: %w", op.name, err)
		}
	}

	return nil
}

func InitDatabase(cfg *Config, appLogger logger.Logger) (*gorm.DB, error) {
	appLogger.Info().
		Str("host", cfg.DBHost).
		Str("user", cfg.DBUser).
		Str("database", cfg.DBName).
		Str("port", cfg.DBPort).
		Msg("Database configuration")

	sslMode := "disable"
	if util.IsProduction() {
		sslMode = "require"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Seoul",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, sslMode,
	)

	maskedDsn := fmt.Sprintf(
		"host=%s user=%s password=*** dbname=%s port=%s sslmode=%s TimeZone=Asia/Seoul",
		cfg.DBHost, cfg.DBUser, cfg.DBName, cfg.DBPort, sslMode,
	)
	appLogger.Info().Str("dsn", maskedDsn).Msg("Attempting database connection")

	logLevel := gormLogger.Error
	if !util.IsProduction() {
		logLevel = gormLogger.Info
	}

	gormLogger := gormLogger.New(
		logger.NewGormWriter(appLogger),
		gormLogger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  !util.IsProduction(),
		},
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})

	if err != nil {
		appLogger.Error().Err(err).Msg("Failed to connect to database")
		return nil, err
	}

	appLogger.Info().Msg("Successfully connected to database")
	return db, nil
}
