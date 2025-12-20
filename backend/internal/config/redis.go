package config

import (
	"context"
	"crypto/tls"
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/go-redis/redis/v8"
)

func InitRedis(cfg *Config, appLogger logger.Logger) (*redis.Client, error) {
	options := &redis.Options{
		Addr:         cfg.RedisHost + ":" + cfg.RedisPort,
		PoolSize:     constants.DefaultRedisPoolSize,
		MinIdleConns: constants.DefaultRedisMinIdleConns,
		MaxRetries:   constants.DefaultRedisMaxRetries,
		DialTimeout:  constants.DefaultRedisDialTimeout,
	}

	if util.IsProduction() {
		options.Username = cfg.RedisUsername
		options.Password = cfg.RedisPassword
		options.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	appLogger.Info().
		Str("host", cfg.RedisHost).
		Str("port", cfg.RedisPort).
		Msg("Redis configuration")

	rdb := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), constants.DefaultRedisDialTimeout)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		appLogger.Error().
			Str("addr", options.Addr).
			Err(err).
			Msg("Failed to connect to Redis")
		return nil, fmt.Errorf("failed to connect to Redis at %s: %w", options.Addr, err)
	}

	appLogger.Info().Msgf("Successfully connected to Redis at %s:%s", cfg.RedisHost, cfg.RedisPort)
	return rdb, nil
}
