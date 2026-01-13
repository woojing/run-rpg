# Tactical Auto-Action RPG POC

Phaser 4 기반 전술 자동 액션 RPG POC

## 프로젝트 개요

**목표**: 그래픽 에셋 없이(도형/텍스트만) "전략 4버튼 + 자동 전투 + 런 종료 후 행동 기반 성장 + 기록"이 재미로 성립하는지 검증

**장르**: Tactical Auto-Action RPG (전술 선택형 자동 액션)

**세션**: 1회 120~180초 (인스턴트 런)

## 핵심 메커닉

- **전략 4버튼**: 플레이어는 전략만 선택
  - ENGAGE (돌진): 공격적 근접전
  - GUARD (방어): 피해 감소
  - EVADE (회피): 이동 + 무적 프레임
  - BURST (폭발): 고속 공격 후 피로

- **자동 전투**: Agent AI가 전략에 따라 자동으로 이동/공격/회피

- **텔레메트리 기반 성장**: 런 종료 후 플레이 스타일 분석 → 런 한정 트레잇 부여

- **기록만 남김**: 성장/재화 손실 없음, 통계/도감만 축적

## 기술 스택

- TypeScript
- Vite
- Phaser 4.0.0-rc.6

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 진행 상황

- ✅ C1: 프로젝트 스캐폴딩 + Phaser 부팅
- ✅ C2: 4버튼 UI + 모바일 터치
- ✅ C3: Agent + Enemy 최소 전투
- ✅ C4: 전략 기반 AI FSM
- ✅ C5: 텔레메트리 + 요약 화면
- ⏳ C6: 성장 시스템 (트레잇)
- ⏳ C7: 적 패턴 3종 + 환경 위험
- ⏳ C8: 디버그 오버레이 + 튜닝

**현재 진행률**: 62.5% (25/40 파일)

## 문서

상세한 구현 계획과 진행 상황은 [docs/implementation-progress.md](docs/implementation-progress.md)를 참고하세요.

## 라이선스

MIT
