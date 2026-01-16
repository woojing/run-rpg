# Testing Guide

## 실행 방법

```bash
# 전체 테스트 실행 (watch mode)
npm test

# 테스트 한 번만 실행 (CI mode)
npm test -- --run

# 테스트 UI 실행
npm run test:ui

# 커버리지 확인
npm run test:coverage
```

## 테스트 구조

```
tests/
├── setup.ts                          # 글로벌 테스트 설정 (localStorage, Phaser mock)
├── unit/                             # 유닛 테스트 (Phaser 없이 실행 가능)
│   ├── ai/
│   │   └── Steering.test.ts          # 이동 벡터 계산 테스트
│   └── systems/
│       ├── Telemetry.test.ts         # 텔레메트리 기록 및 정산 테스트
│       └── GrowthResolver.test.ts    # 플레이 스타일 분류 테스트
└── integration/                      # 통합 테스트 (Phaser HEADLESS 필요)
    └── scenes/
        └── BattleScene.death.test.ts # 사망 flow 테스트 (예정)
```

## 현재 테스트 커버리지

| 파일 | 테스트 수 | 상태 |
|------|----------|------|
| Steering.test.ts | 10 | ✅ 통과 |
| Telemetry.test.ts | 27 | ✅ 통과 |
| GrowthResolver.test.ts | 18 | ✅ 통과 |
| **합계** | **55** | ✅ **전체 통과** |

## Mock 설정

### localStorage Mock
`tests/setup.ts`에서 localStorage를 mock하여 `RunRecorder` 테스트 시 브라우저 저장소 사용 방지

### Phaser Mock
`tests/setup.ts`에서 전역 `Phaser` 객체를 mock하여 유닛 테스트에서 Phaser 의존성 제거

## 새 테스트 작성법

### 유닛 테스트 작성

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { YourClass } from '@/game/path/to/YourClass'

describe('YourClass', () => {
  let instance: YourClass

  beforeEach(() => {
    instance = new YourClass()
  })

  it('should do something', () => {
    const result = instance.method()
    expect(result).toBe(expectedValue)
  })
})
```

### 통합 테스트 작성 (Phaser HEADLESS)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Phaser from 'phaser'

describe('Integration Test', () => {
  let game: Phaser.Game

  beforeEach(async () => {
    game = new Phaser.Game({
      type: Phaser.HEADLESS,
      width: 1920,
      height: 1080,
      // ... config
    })
  })

  afterEach(() => {
    game.destroy(true)
  })

  it('should test Phaser scene', () => {
    // Test implementation
  })
})
```

## 주의사항

1. **유닛 테스트**: Phaser 의존이 없는 순수 로직 함수만 테스트
2. **통합 테스트**: Phaser HEADLESS 모드 사용, jsdom 환경 필요
3. **Mock 리셋**: `beforeEach`에서 `vi.clearAllMocks()` 호출하여 테스트 격리

## 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [Phaser 4 문서](https://newdocs.phaser.io/docs/4.0.0)
- [테스트 전략 문서](../docs/test-strategy.md)
