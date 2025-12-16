package config

import (
	"context"
	"crypto/tls"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
)

func InitRedis(cfg *Config) *redis.Client {
	options := &redis.Options{
		Addr:         cfg.RedisHost + ":" + cfg.RedisPort,
		PoolSize:     constants.DefaultRedisPoolSize,
		MinIdleConns: constants.DefaultRedisMinIdleConns,
		MaxRetries:   constants.DefaultRedisMaxRetries,
		DialTimeout:  constants.DefaultRedisDialTimeout,
	}
	// TRIGGER CI/CD

	if util.IsProduction() {
		options.Username = cfg.RedisUsername
		options.Password = cfg.RedisPassword
		options.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	rdb := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), constants.DefaultRedisDialTimeout)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal().Str("addr", options.Addr).Err(err).Msg("Failed to connect to Redis")
	}

	log.Info().Msgf("Connected to Redis at %s:%s", cfg.RedisHost, cfg.RedisPort)
	return rdb
}
