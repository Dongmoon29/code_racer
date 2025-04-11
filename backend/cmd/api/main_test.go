package main

import (
	"fmt"
	"log"
	"os"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/seed"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestInitDatabase(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	testConfig := testutil.SetupTestConfig()

	// 실제 DB 연결 테스트
	db, err := initDatabase(testConfig, testLogger)
	if err != nil {
		t.Skipf("Skipping DB test due to connection error: %v", err)
		return
	}

	assert.NotNil(t, db)
	assert.IsType(t, &gorm.DB{}, db)

	// DB 설정 테스트
	sqlDB, err := db.DB()
	require.NoError(t, err)
	assert.NoError(t, sqlDB.Ping())
}

func TestInitRedis(t *testing.T) {
	testConfig := testutil.SetupTestConfig()

	// 실제 Redis 연결 테스트
	rdb := initRedis(testConfig)
	if rdb == nil {
		t.Skip("Skipping Redis test due to connection error")
		return
	}

	assert.NotNil(t, rdb)
	assert.IsType(t, &redis.Client{}, rdb)
}

func TestSetupDatabase(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	testConfig := testutil.SetupTestConfig()

	db, err := initDatabase(testConfig, testLogger)
	if err != nil {
		t.Skipf("Skipping setup database test due to connection error: %v", err)
		return
	}

	err = setupDatabase(db)
	assert.NoError(t, err)

	// UUID extension 확인
	var hasExtension bool
	err = db.Raw("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')").Scan(&hasExtension).Error
	assert.NoError(t, err)
	assert.True(t, hasExtension)

	// 테이블 존재 확인
	tables := []string{"users", "games", "leet_codes"}
	for _, table := range tables {
		var exists bool
		err = db.Raw("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ?)", table).Scan(&exists).Error
		assert.NoError(t, err)
		assert.True(t, exists)
	}
}

func TestInitializeDependencies(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	testConfig := testutil.SetupTestConfig()

	db, err := initDatabase(testConfig, testLogger)
	if err != nil {
		t.Skipf("Skipping dependencies test due to DB connection error: %v", err)
		return
	}

	rdb := initRedis(testConfig)
	if rdb == nil {
		t.Skip("Skipping dependencies test due to Redis connection error")
		return
	}

	deps := initializeDependencies(db, rdb, testConfig, testLogger)

	// 의존성 검증
	assert.NotNil(t, deps)
	assert.NotNil(t, deps.authController)
	assert.NotNil(t, deps.gameController)
	assert.NotNil(t, deps.wsController)
	assert.NotNil(t, deps.authMiddleware)
}

// 테스트 헬퍼 함수들
func TestMain(m *testing.M) {
	// 테스트 환경 설정
	os.Setenv("GIN_MODE", "test")

	// 테스트 DB 설정
	testLogger := testutil.SetupTestLogger()
	testConfig := testutil.SetupTestConfig()

	// DB 연결
	db, err := initDatabase(testConfig, testLogger)
	if err != nil {
		log.Printf("Failed to connect to test database: %v", err)
		os.Exit(1)
	}

	// 마이그레이션 실행
	if err := setupTestDatabase(db); err != nil {
		log.Printf("Failed to setup test database: %v", err)
		os.Exit(1)
	}

	// 테스트 실행
	code := m.Run()

	// 테스트 환경 정리 (선택사항)
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	os.Exit(code)
}

func setupTestDatabase(db *gorm.DB) error {
	// UUID extension 생성
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";").Error; err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// 테이블 생성
	if err := db.AutoMigrate(
		&model.User{},
		&model.Game{},
		&model.LeetCode{},
	); err != nil {
		return fmt.Errorf("failed to migrate tables: %w", err)
	}

	// 테스트 데이터 시드 (필요한 경우)
	if err := seed.SeedLeetCodeProblem(db); err != nil {
		return fmt.Errorf("failed to seed data: %w", err)
	}

	return nil
}
