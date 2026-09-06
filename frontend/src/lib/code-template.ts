import type { ProblemDetail } from "@/types";

export function getCodeTemplate(
  problem: ProblemDetail | null | undefined,
  language: string,
): string {
  if (!problem?.io_templates) return "";

  return (
    problem.io_templates.find((template) => template.language === language)
      ?.code ?? ""
  );
}
