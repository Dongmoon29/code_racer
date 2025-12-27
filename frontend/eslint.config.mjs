import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript 타입 안전성 강화
      "@typescript-eslint/no-explicit-any": "warn", // any 사용 시 경고
      "@typescript-eslint/no-unsafe-assignment": "off", // 너무 엄격하므로 off
      "@typescript-eslint/no-unsafe-member-access": "off", // 너무 엄격하므로 off
      "@typescript-eslint/no-unsafe-call": "off", // 너무 엄격하므로 off

      // 명시적 함수 반환 타입 (선택적)
      // "@typescript-eslint/explicit-function-return-type": "warn",

      // unknown 타입 체크는 허용 (error handling에 필요)
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
];

export default eslintConfig;
