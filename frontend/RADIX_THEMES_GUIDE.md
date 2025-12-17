# Radix Themes 사용 가이드

## 설치 완료 ✅

Radix Themes가 설치되고 `_app.tsx`에 통합되었습니다.

## 주요 특징

### 1. **색상 조합 자동화** 🎨
- Radix Themes는 미리 정의된 색상 팔레트를 제공합니다
- 색상 조합을 직접 할 필요가 없습니다
- `accentColor`, `grayColor`만 선택하면 됩니다

### 2. **현재 설정**
```typescript
<Theme
  appearance={radixTheme as 'light' | 'dark'}
  accentColor="green"      // 주요 색상 (green, blue, purple, etc.)
  grayColor="slate"        // 회색 톤 (slate, gray, mauve, etc.)
  radius="medium"          // 둥근 모서리 (none, small, medium, large, full)
/>
```

### 3. **사용 가능한 색상 옵션**

#### Accent Colors (주요 색상)
- `tomato`, `red`, `ruby`, `crimson`, `pink`, `plum`
- `purple`, `violet`, `iris`, `indigo`, `blue`, `cyan`
- `teal`, `jade`, `green`, `grass`, `brown`, `orange`
- `amber`, `yellow`, `lime`, `mint`, `sky`

#### Gray Colors (회색 톤)
- `gray`, `mauve`, `slate`, `sage`, `olive`, `sand`

#### Radius (둥근 모서리)
- `none`, `small`, `medium`, `large`, `full`

## Radix Themes 컴포넌트 사용하기

### 기본 사용법

```typescript
import { Button, Card, Text, Heading } from '@radix-ui/themes';

function MyComponent() {
  return (
    <Card>
      <Heading>제목</Heading>
      <Text>내용</Text>
      <Button>버튼</Button>
    </Card>
  );
}
```

### 기존 Tailwind 컴포넌트와 함께 사용

Radix Themes는 CSS 변수를 사용하므로, 기존 Tailwind 컴포넌트와 함께 사용할 수 있습니다:

```typescript
// Radix Themes 색상 사용
<div className="bg-[var(--color-panel)] text-[var(--color-text)]">
  내용
</div>
```

## 테마 변경하기

현재 설정을 변경하려면 `_app.tsx`의 `RadixThemeWrapper` 컴포넌트를 수정하세요:

```typescript
<Theme
  appearance={radixTheme as 'light' | 'dark'}
  accentColor="blue"        // 원하는 색상으로 변경
  grayColor="gray"          // 원하는 회색 톤으로 변경
  radius="large"            // 원하는 둥근 모서리로 변경
>
```

## Radix Themes CSS 변수

Radix Themes는 다음과 같은 CSS 변수를 제공합니다:

- `--color-background`: 배경색
- `--color-foreground`: 전경색 (텍스트)
- `--color-panel`: 패널 배경색
- `--color-panel-solid`: 단색 패널 배경
- `--accent-*`: Accent 색상 변형들
- `--gray-*`: Gray 색상 변형들

## 다음 단계

1. **컴포넌트 마이그레이션**: 기존 컴포넌트를 Radix Themes 컴포넌트로 점진적으로 전환
2. **색상 테스트**: 다른 `accentColor`와 `grayColor` 조합 테스트
3. **커스터마이징**: 필요시 CSS 변수 오버라이드

## 참고 자료

- [Radix Themes 공식 문서](https://www.radix-ui.com/themes)
- [Radix Themes 색상 가이드](https://www.radix-ui.com/themes/docs/theme/color)
- [Radix Themes 컴포넌트](https://www.radix-ui.com/themes/docs/components/overview)

