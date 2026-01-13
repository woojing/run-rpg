# Tactical Auto-Action RPG POC - Implementation Progress

## Project Overview
- **Goal**: Phaser 4 기반 전술 자동 액션 RPG POC 개발
- **Tech Stack**: TypeScript + Vite + Phaser 4.0.0-rc.6
- **Constraints**: No graphics assets (도형/텍스트만), Desktop + Mobile Touch
- **Run Length**: 120-180초

---

## ✅ Commit C2: Input (UI) 4 Buttons + Mobile Touch Support (완료)

**Objective**: 4개 전략 버튼 + 시각적 피드백 + 키보드 단축키 + 터치 지원

### 완료된 파일들 (4개):
1. ✅ `src/game/ai/Strategy.ts` - Strategy enum + 설정
2. ✅ `src/game/ui/StrategyBar.ts` - 4 버튼 컨테이너 (하단 20%)
3. ✅ `src/game/ui/Hud.ts` - 상단 HUD (타이머, HP, 현재 전략)
4. ✅ `src/game/scenes/BattleScene.ts` - 업데이트 (UI 통합, 입력 처리)

### Key Features:
```typescript
// 4개 버튼: ENGAGE (빨강), GUARD (녹색), EVADE (파랑), BURST (노랑)
// 각 버튼: 200x100px, 큰 터치 히트박스
// 키보드: 1, 2, 3, 4 키로도 전략 변경 가능
// 버튼 클릭 시:
//   - 활성 버튼: 불투명도 80%, 굵은 흰색 테두리
//   - 비활성 버튼: 불투명도 30%, 얇은 색상 테두리
//   - hover 시: 불투명도 60%
```

### UI 레이아웃:
- **상단 HUD** (y=0-80px):
  - 왼쪽: 타이머 (120초)
  - 중앙: HP (100/100)
  - 우측: 현재 전략 (ENGAGE/GUARD/EVADE/BURST)
- **하단 버튼바** (y=~950-1050px):
  - 4개 버튼이 균등하게 분배
  - 각 버튼에 키보드 단축키 힌트 [1][2][3][4]
- **중앙**: 테스트 원 (전략 변경 시 색상 변화)

### 검증 완료:
- ✅ 4개 버튼이 하단에 올바른 색상으로 표시
- ✅ 버튼 클릭/터치 → 하이라이트, HUD 업데이트, 원 색상 변경
- ✅ 키보드 1-4 키 작동
- ✅ 전략 변경이 콘솔에 로깅됨
- ✅ `npm run build` 성공

---

## ✅ Commit C1: Project Scaffolding + Phaser Boot (완료)

**Objective**: Vite + TypeScript + Phaser 4 프로젝트 초기화

### 완료된 파일들 (10개):
1. ✅ `package.json` - 의존성 설정 (vite, typescript, phaser@4.0.0-rc.6)
2. ✅ `tsconfig.json` - TypeScript strict mode 설정
3. ✅ `vite.config.ts` - Vite 빌드 설정
4. ✅ `index.html` - 엔트리 포인트 (#game-container)
5. ✅ `src/main.ts` - Phaser 게임 인스턴스 생성
6. ✅ `src/game/config.ts` - Phaser 설정 (1920x1080, FIT scale, Arcade physics)
7. ✅ `src/game/constants.ts` - 색상 팔레트, Scene keys
8. ✅ `src/game/data/balance.ts` - 밸런스 상수 (플레이스홀더)
9. ✅ `src/game/scenes/BootScene.ts` - 초기화 Scene
10. ✅ `src/game/scenes/BattleScene.ts` - 테스트 녹색 원이 있는 Battle Scene

### Best Practices 적용:
- Vite가 TypeScript를 직접 처리하도록 설정 (`vite build`, `tsc && vite build` ❌)
- ES 모듈을 위해 import 문에 `.js` 확장자 사용
- TypeScript strict mode 활성화

### 검증 완료:
- ✅ `npm run dev` - http://localhost:3000/에서 개발 서버 실행
- ✅ `npm run build` - dist/ 폴더에 프로덕션 번들 생성
- ✅ 브라우저에서 Phaser 부팅 확인 (녹색 원 + "PHASER 4 BOOTED" 텍스트)

---

## 🔄 진행 예정: Commits C2-C8

### 📋 Commit C2: Input (UI) 4 Buttons + Mobile Touch Support

**Objective**: 4개 전략 버튼 + 시각적 피드백 + 키보드 단축키 + 터치 지원

**생성할 파일 (3개)**:
1. `src/game/ui/StrategyBar.ts` - 4 버튼 컨테이너 (하단 20%)
2. `src/game/ui/Hud.ts` - 상단 HUD (타이머, HP, 현재 전략)
3. `src/game/scenes/BattleScene.ts` - 업데이트 (UI 통합, 입력 처리)

**Key Features**:
```typescript
// 4개 버튼: ENGAGE (빨강), GUARD (녹색), EVADE (파랑), BURST (노랑)
// 각 버튼: 200x100px, 큰 터치 히트박스
// 키보드: 1, 2, 3, 4 키로도 전략 변경 가능
```

**검증 체크리스트**:
- [ ] 4개 버튼이 하단에 올바른 색상으로 표시
- [ ] 버튼 클릭/터치 → 하이라이트, HUD 업데이트
- [ ] 키보드 1-4 키 작동
- [ ] 모바일 터치 작동 (Chrome DevTools 에뮬레이션)
- [ ] 전략 변경이 콘솔에 로깅됨

---

### ✅ Commit C3: Agent + Enemy Minimal Combat (완료)

**Objective**: 플레이어 가능한 엔티티 + 기본 전투 시스템

### 완료된 파일들 (6개):
1. ✅ `src/game/entities/Agent.ts` - 플레이어 엔티티 (파란 원, HP 100, 기본 공격)
2. ✅ `src/game/entities/Enemy.ts` - 기본 적 엔티티 (빨간 사각형, 간단한 AI)
3. ✅ `src/game/entities/EnemyFactory.ts` - 웨이브 스포너
4. ✅ `src/game/systems/CombatSystem.ts` - 피해 계산, 히트 감지
5. ✅ `src/game/systems/RunTimer.ts` - 120초 카운트다운
6. ✅ `src/game/scenes/BattleScene.ts` - 업데이트 (엔티티 통합, 게임 루프)

### Key Features:
```typescript
// Agent: 파란 원 (반경 40px), HP 100, 기본 공격 (반경 60px)
// Enemy: 빨간 사각형 (40x40), Agent를 향해 이동, 접촉 시 피해
// 웨이브 스폰:
//   0-30s: Rushers 3초마다 스폰
//   30-70s: Rushers 2.5초마다 스폰
//   70-120s: Rushers 2초마다 스폰
```

### 게임 플레이:
- Agent가 화면 중앙에서 스폰 (파란 원)
- Enemy가 화면 가장자리에서 스폰되어 Agent 추적
- Agent가 근처 적을 자동 공격 (흰색 원 확장 애니메이션)
- 적이 접촉 시 Agent 피해 (8 데미지)
- 적 HP 0 → fade out 애니메이션 후 제거
- Agent HP 0 → "RUN FAILED"
- 타이머 0 → "RUN COMPLETE"

### 시스템 상호작용:
```
RunTimer (120s 카운트다운)
  ↓
EnemyFactory (시간 경과에 따른 스폰)
  ↓
Enemy[] (활성 적 목록)
  ↓
CombatSystem.checkMeleeHit() (Agent 자동 공격)
  ↓
Enemy.takeDamage() / Agent.takeDamage()
  ↓
HP 0 확인 → endRun(victory: boolean)
```

### 검증 완료:
- ✅ Agent가 파란 원으로 스폰, 적들이 빨간 사각형으로 스폰
- ✅ Agent가 근처 적들을 자동 공격 (원형 범위 표시)
- ✅ 적들이 피해를 입고 죽음 (fade out)
- ✅ Agent가 접촉 시 피해를 입음 (하얗게 깜빡임)
- ✅ HP 0 도달 시 런 종료
- ✅ 120초 타이머 작동
- ✅ R 키로 재시작 가능
- ✅ `npm run build` 성공

---

## 📋 Commit C4: Strategy-Based AI State Machine

**Objective**: 플레이어 가능한 엔티티 + 기본 전투 시스템

**생성할 파일 (6개)**:
1. `src/game/entities/Agent.ts` - 플레이어 엔티티 (파란 원, HP, 기본 공격)
2. `src/game/entities/Enemy.ts` - 기본 적 엔티티 (빨간 사각형, 간단한 AI)
3. `src/game/entities/EnemyFactory.ts` - 웨이브 스포너
4. `src/game/systems/CombatSystem.ts` - 피해 계산, 히트 감지
5. `src/game/systems/RunTimer.ts` - 120초 카운트다운
6. `src/game/scenes/BattleScene.ts` - 업데이트 (엔티티 통합, 게임 루프)

**Key Features**:
```typescript
// Agent: 파란 원 (반경 40px), HP 100, 기본 공격 (반경 60px)
// Enemy: 빨간 사각형 (40x40), Agent를 향해 이동, 접촉 시 피해
// 웨이브 스폰: 0-30초 Rushers만
```

**검증 체크리스트**:
- [ ] Agent가 파란 원으로 스폰, 적들이 빨간 사각형으로 스폰
- [ ] Agent가 근처 적들을 자동 공격
- [ ] 적들이 피해를 입고 죽음 (fade out)
- [ ] Agent가 접촉 시 피해를 입음 (하얗게 깜빡임)
- [ ] HP 0 도달 시 런 종료
- [ ] 10개의 적을 죽여서 전투 작동 확인

---

### 📋 Commit C4: Strategy-Based AI State Machine

**Objective**: 핵심 전술 메커닉 - 4개 전략이 Agent 행동 변경

**생성할 파일 (5개)**:
1. `src/game/ai/Strategy.ts` - Strategy enum + 설정
2. `src/game/ai/ThreatModel.ts` - 위협도 점수 시스템
3. `src/game/ai/Steering.ts` - 이동 행동 (seek, flee, orbit)
4. `src/game/ai/AgentAI.ts` - FSM + 의사결정 로직
5. `src/game/entities/Agent.ts` - 업데이트 (AI 제어, 특수 능력)

**Key Features**:
```typescript
// ENGAGE: 공격적, 돌진 공격, Sniper 우선
// GUARD: 50% 피해 감소, 반격
// EVADE: 대시와 i-frames, 거리 유지
// BURST: 1.5초 공격속도 버프, 그 후 피로
```

**검증 체크리스트**:
- [ ] ENGAGE → Agent가 공격적으로 움직임, 돌진 공격 트리거
- [ ] GUARD → Agent가 50% 적은 피해, 위협을 향함
- [ ] EVADE → Agent가 거리 유지, 위협에서 대시하여 회피
- [ ] BURST → Agent가 빠르게 공격, 그 후 느려짐 (피로)
- [ ] 각 전략이 명확하게 다른 느낌

---

### ✅ Commit C5: Telemetry Collection + Run Summary Screen (완료)

**Objective**: 모든 플레이어 행동/선택 추적, 포괄적인 런 요약 표시

### 완료된 파일들 (4개):
1. ✅ `src/game/systems/Telemetry.ts` - 이벤트 추적 시스템
2. ✅ `src/game/systems/RunRecorder.ts` - 영구 저장소 (localStorage)
3. ✅ `src/game/scenes/SummaryScene.ts` - 런 종료 요약 화면
4. ✅ `src/game/scenes/BattleScene.ts` - 업데이트 (텔레메트리 추적 통합)
5. ✅ `src/game/entities/Agent.ts` - 업데이트 (damageTaken 이벤트)

### Telemetry 추적 항목:
```typescript
interface TelemetryData {
  // 전략 사용
  strategyTime: { ENGAGE, GUARD, EVADE, BURST } // 각 전략 유지 시간
  strategySwitchCount: number

  // 생존/위험
  timeBelowHp30: number // 30% HP 이하 시간
  hitsTakenCount: number
  damageTakenTotal: number

  // 회피
  evadeCount: number
  evadeSuccessCount: number

  // 공격
  damageDealtTotal: number
  killsByArchetype: { Rusher, Sniper, Elite }
  burstActivations: number

  // 런 메타데이터
  runDuration: number // 초
  runResult: 'victory' | 'defeat'
}
```

### SummaryScene UI 레이아웃:
```
┌─────────────────────────────────────────────┐
│          RUN COMPLETE! / RUN FAILED!         │
│          Time: 120.0s                        │
├──────────┬──────────┬──────────┬────────────┤
│ STRATEGY │ SURVIVAL │ PERFORMANCE│ EVASION   │
│ USAGE    │          │            │           │
├──────────┼──────────┼──────────┼────────────┤
│ Engage   │ Time <30%│ Damage    │ Evades    │
│ Guard    │ Hits     │ Kills     │ Successful │
│ Evade    │ Taken    │ Rusher    │ Success % │
│ Burst    │ Damage   │ Sniper    │ Bursts    │
│ Switches │          │ Elite     │           │
└──────────┴──────────┴──────────┴────────────┘
│           [    NEXT RUN    ]                  │
└─────────────────────────────────────────────┘
```

### 추적 로직:
- **전략 시간**: 매 frame `recordStrategyTime()` 호출
- **전략 변경**: 버튼/키보드 입력 시 `recordStrategyChange()`
- **피해**: Agent.takeDamage()에서 'damageTaken' 이벤트 emit
- **HP 30% 이하**: 매 frame 체크 후 `recordTimeBelowHp30()`
- **처치**: enemy 배열 필터링으로 감지, `recordKill()`
- **런 종료**: `finalizeRun()`로 파생 통계 계산

### RunRecorder (localStorage):
- 최근 20개 런 저장
- 누적 통계 (총 런 수, 승리, 평균 시간, 총 킬)
- 프로필 분포 (C6에서 사용)
- 브라우저 개발자 도구 → Application → Local Storage에서 확인 가능

### 게임 플레이 흐름:
```
BattleScene (게임 플레이)
  ↓ 모든 행동 추적
Telemetry (실시간 기록)
  ↓ 런 종료 시
finalizeRun() (파생 통계 계산)
  ↓
RunRecorder.saveRun() (localStorage 저장)
  ↓
SummaryScene (요약 표시)
  ↓ "NEXT RUN" 버튼
BattleScene (새 런 시작)
```

### 검증 완료:
- ✅ 런 완료 → SummaryScene에 4개 통계 열 표시
- ✅ 전략 시간이 실제 플레이 시간과 합산
- ✅ 피해/킬/시간이 정확하게 기록
- ✅ 승리/실패에 따라 다른 제목/색상
- ✅ "NEXT RUN" 버튼으로 새 런 시작
- ✅ localStorage에 런 기록 저장
- ✅ `npm run build` 성공

---

## 📋 Commit C6: Growth (Run-Only Traits) Application

**Objective**: 모든 플레이어 행동/선택 추적, 포괄적인 런 요약 표시

**생성할 파일 (4개)**:
1. `src/game/systems/Telemetry.ts` - 이벤트 추적 (전략 시간, 피해, 킬 등)
2. `src/game/systems/RunRecorder.ts` - 영구 저장소 (localStorage)
3. `src/game/scenes/SummaryScene.ts` - 런 종료 요약 디스플레이
4. `src/game/scenes/BattleScene.ts` - 업데이트 (텔레메트리 추적 통합)

**Key Features**:
```typescript
interface TelemetryData {
  strategyTime: { [key in Strategy]: number }
  damageDealtTotal: number
  killsByArchetype: { [key in EnemyArchetype]: number }
  evadeSuccessCount: number
  // ... 더 많은 메트릭
}
```

**검증 체크리스트**:
- [ ] 런 완료 → SummaryScene이 모든 4개 통계 열 표시
- [ ] 통계 정확함 (시간, 피해, 킬 확인)
- [ ] RESTART 버튼 작동, 새 런이 신선하게 시작
- [ ] 실패/사망 → "RUN FAILED" 표시
- [ ] 승리/타이머 → "RUN COMPLETE" 표시

---

### 📋 Commit C6: Growth (Run-Only Traits) Application

**Objective**: 텔레메트리 기반 프로필 감지 + 의미 있는 효과의 트레잇 시스템

**생성할 파일 (4개)**:
1. `src/game/systems/GrowthResolver.ts` - 프로필 감지 + 트레잇 할당
2. `src/game/data/growthTraits.ts` - 6개 트레잇 정의
3. `src/game/scenes/SummaryScene.ts` - 업데이트 (프로필 + 트레잇 표시)
4. `src/game/entities/Agent.ts` - 업데이트 (트레잇 효과 적용)

**Key Features**:
```typescript
// 6개 트레잇:
// PHANTOM_TRACE: Evade 후 1.0초간 -50% 피해
// REFLEX_BURST: Evade 후 첫 공격 +40% 피해
// OVERCLOCK_CHARGE: Engage 돌진 거리 +25%
// BLOOD_EXCHANGE: 가한 피해의 3% 흡혈
// ADAPTIVE_SHIELD: Guard 중 스태미나 재생 +50%
// THREAT_REDIRECT: AI가 Sniper 30% 더 빨리 우선처리

// 프로필: dodge-counter, aggro-burst, shield-control
```

**검증 체크리스트**:
- [ ] 높은 Evade 사용 → "Dodge-Counter" 프로필 + 트레잇
- [ ] 높은 피해 딜링 → "Aggro-Burst" 프로필 + 트레잇
- [ ] 높은 Guard 시간 → "Shield-Control" 프로필 + 트레잇
- [ ] SummaryScene이 프로필 이름 + 설명 + 트레잇 카드 표시
- [ ] NEXT RUN이 Agent에 트레잇 적용
- [ ] 트레잇에 가시적인 효과 있음 (콘솔 HP/피해로 테스트)

---

### 📋 Commit C7: Difficulty/Enemy Patterns 3 Types + Environmental Hazard

**Objective**: 뚜렷한 적 행동 + 환경 위험

**생성할 파일 (4개)**:
1. `src/game/data/enemyArchetypes.ts` - 적 설정 (Rusher, Sniper, Elite)
2. `src/game/entities/Enemy.ts` - 업데이트 (아키타입별 AI 행동)
3. `src/game/entities/EnemyFactory.ts` - 업데이트 (난이도 커브와 스폰 로직)
4. `src/game/entities/Hazard.ts` - 전기 장벽 (시안 펄싱 라인)

**Key Features**:
```typescript
// 적 행동:
Rusher: Agent를 향해 직선, 근접 공격
Sniper: 거리 유지, 노란 투사체 발사, strafe
Elite: 전조 공격 (빨강 점멸), 그 후 돌진

// 스폰 커브:
0-30초: Rushers만
30-70초: Rushers + Snipers
70-120초: 혼합 + Elites (20% 확률)
60초: 전기 장벽 스폰
```

**검증 체크리스트**:
- [ ] Rushers가 초기에 스폰, 공격적 근접
- [ ] Snipers가 거리 유지, 투사체 발사
- [ ] Elites가 돌진 전 빨강 점멸
- [ ] 60초에 전기 장벽 등장, 접촉 시 피해
- [ ] Evade 전략이 장벽을 효과적으로 회피
- [ ] 모든 3가지 적 타입 처치 가능

---

### 📋 Commit C8: Debug Overlay + Tuning

**Objective**: 밸런스 튜닝을 위한 포괄적인 디버그 도구

**생성할 파일 (3개)**:
1. `src/game/ui/DebugOverlay.ts` - 온스크린 디버그 디스플레이
2. `src/game/data/balance.ts` - 업데이트 (모든 튜닝 가능한 값 노출)
3. `src/game/scenes/BattleScene.ts` - 업데이트 ('D' 키로 디버그 토글)

**Key Features**:
```typescript
// 디버그 오버레이 섹션:
AI STATE: Strategy, position, velocity, primary target
THREAT SCORES: 상위 4개 위협과 점수
TELEMETRY: 실시간 통계 (피해, 회피, 킬)
BALANCE: 현재 config 값
CONTROLS: [D] Toggle, [R] Restart
```

**검증 체크리스트**:
- [ ] 'D' 누름 → 디버그 오버레이 나타남 (좌측)
- [ ] 모든 섹션이 실시간으로 업데이트
- [ ] 'D' 다시 누름 → 오버레이 숨김
- [ ] 'R' 누름 → 런 재시작
- [ ] BALANCE 값 수정 → 인게임 변경사항 반영
- [ ] 5번 런 → 평균 ~120초가 될 때까지 튜닝

---

## 📁 전체 파일 구조

```
src/
├── main.ts
├── game/
│   ├── config.ts
│   ├── constants.ts
│   ├── scenes/
│   │   ├── BootScene.ts ✅
│   │   ├── BattleScene.ts ✅
│   │   └── SummaryScene.ts 📋 (C5)
│   ├── ui/
│   │   ├── StrategyBar.ts 📋 (C2)
│   │   ├── Hud.ts 📋 (C2)
│   │   └── DebugOverlay.ts 📋 (C8)
│   ├── entities/
│   │   ├── Agent.ts 📋 (C3)
│   │   ├── Enemy.ts 📋 (C3)
│   │   ├── EnemyFactory.ts 📋 (C3)
│   │   ├── Projectile.ts 📋 (C7)
│   │   └── Hazard.ts 📋 (C7)
│   ├── ai/
│   │   ├── Strategy.ts 📋 (C4)
│   │   ├── AgentAI.ts 📋 (C4)
│   │   ├── ThreatModel.ts 📋 (C4)
│   │   └── Steering.ts 📋 (C4)
│   ├── systems/
│   │   ├── CombatSystem.ts 📋 (C3)
│   │   ├── Telemetry.ts 📋 (C5)
│   │   ├── RunTimer.ts 📋 (C3)
│   │   ├── GrowthResolver.ts 📋 (C6)
│   │   └── RunRecorder.ts 📋 (C5)
│   └── data/
│       ├── balance.ts ✅
│       ├── growthTraits.ts 📋 (C6)
│       └── enemyArchetypes.ts 📋 (C7)
```

✅ = 완료 | 📋 = 예정

---

## 📊 진행 상황

| Commit | 상태 | 파일 수 | 설명 |
|--------|------|---------|------|
| C1 | ✅ 완료 | 10 | 프로젝트 스캐폴딩 + Phaser 부팅 |
| C2 | ✅ 완료 | 4 | 4버튼 UI + 모바일 터치 |
| C3 | ✅ 완료 | 6 | Agent + Enemy 최소 전투 |
| C4 | ✅ 완료 | 5 | 전략 기반 AI FSM |
| C5 | ✅ 완료 | 4 | 텔레메트리 + 요약 화면 |
| C6 | ⏳ 예정 | 4 | 성장 시스템 (트레잇) |
| C7 | ⏳ 예정 | 4 | 적 패턴 3종 + 환경 위험 |
| C8 | ⏳ 예정 | 3 | 디버그 오버레이 + 튜닝 |
| **합계** | **62.5%** | **40** | |

---

## 🎯 성공 기준

### 정성적 기준:
- [ ] 사용자가 3판 이상 "한 판 더"를 자발적으로 누름
- [ ] 사용자 피드백에서 "버튼 4개로 판단하는 재미"가 언급됨

### 정량적 기준:
- [ ] 평균 런 길이가 90~180초 내에 수렴
- [ ] 버튼 사용이 특정 1개에 쏠리지 않고 상황별 분산

---

## 📝 참고: PRD 원칙

### POC 원칙:
- ✅ 에셋 없음: Graphics(도형), BitmapText/DOMText(텍스트)만 사용
- ✅ Physics는 단순하게(원형/사각 충돌) — 복잡한 물리 X
- ✅ 1회 120~180초 세션 (인스턴트 런)
- ✅ 성장 = 런 종료 후 일괄 적용, 다음 런에는 리셋
- ✅ 페널티 = 기록만 남김 (진정한 인스턴트 런)

---

*마지막 업데이트: C5 완료, 62.5% 진행*
