# 테스트 전략 (Phaser 4 기반)

이 문서는 브라우저에서 풀 플레이를 하지 않고도 사망(Death) 에러를 코드 레벨에서 재현·검증하기 위한 테스트 전략을 정리합니다.

## 1) 테스트 피라미드 (현재 구조 기준)

### 순수 로직 유닛 테스트 (Phaser 없이 가능)
- `src/game/ai/Steering.ts`: 이동 벡터 계산
- `src/game/ai/ThreatModel.ts`: 위협도 평가/타겟 선정
- `src/game/ai/Strategy.ts`: 전략 enum 매핑
- `src/game/systems/Telemetry.ts`: 텔레메트리 누적/결과 정리
- `src/game/systems/GrowthResolver.ts`: 플레이 스타일 → 트레잇 결정
- `src/game/systems/RunTimer.ts`: 시간 진행/완료 조건
- `src/game/systems/RunRecorder.ts`: 저장/로드 (스토리지 mock 필요)
- `src/game/data/*`: 밸런스/트레잇 데이터 정합성

### 헤드리스 통합 테스트 (Phaser 필요, 렌더링 없음)
- `src/game/scenes/BattleScene.ts`: 사망 시 `endRun(false)` 호출/요약 씬 전환
- `src/game/entities/Agent.ts`: `takeDamage` 후 `died` 이벤트
- `src/game/entities/Enemy.ts`: 접촉 데미지/사망 처리
- `src/game/systems/CombatSystem.ts`: 근접 히트 판정

## 2) 테스트 런타임 선택

- Vite 기반이므로 **Vitest + jsdom** 조합 권장
- Phaser 4 HEADLESS 렌더러는 **DOM 환경이 필요**하므로 jsdom 같은 가상 DOM 필요

## 3) 유닛 테스트 우선순위 (브라우저 없이 바로 가능)

- `Telemetry.finalizeRun()` 결과 검증
- `GrowthResolver`의 플레이 스타일 분류 정확성
- `RunTimer` 시간 경과 이벤트
- `Steering` 벡터 계산값 안정성

## 4) 헤드리스 통합 테스트 설계 (사망 재현 목표)

### 목표
- 사망 → `endRun(false)` → 텔레메트리 저장 → Summary 씬 전환

### 접근
- Phaser `GameConfig`에서 `type: Phaser.HEADLESS`
- `BattleScene` 로드 후 `agent.takeDamage(9999)` 호출
- `scene.start(SCENE_KEYS.SUMMARY, { telemetry })` 호출 여부 확인

### 주의사항
- HEADLESS라도 DOM 필요 (jsdom 필수)
- `RunRecorder`는 `localStorage` 사용 → 테스트 환경에서 mock 필요

## 5) 테스트를 쉽게 만드는 구조 개선(선택)

- `Agent`/`Enemy`의 로직을 순수 모델로 분리
- `takeDamage`, `heal`, `die` 같은 로직을 Phaser 의존 없는 클래스로 이동
- `Agent`는 렌더링·씬 연결만 담당

## 6) 사망 에러 재현용 테스트 시나리오

1. `BattleScene` 생성
2. `agent.takeDamage(9999)` 호출
3. `endRun(false)` 호출 확인
4. `RunRecorder.saveRun` 호출 확인
5. `SummaryScene` 전환 확인

## 7) 테스트 파일 위치 예시

- `tests/unit/Steering.test.ts`
- `tests/unit/Telemetry.test.ts`
- `tests/unit/GrowthResolver.test.ts`
- `tests/integration/BattleScene.death.test.ts`

