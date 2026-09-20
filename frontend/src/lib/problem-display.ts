function matchesParameterType(value: unknown, parameterType: string): boolean {
  if (parameterType.endsWith("[]")) {
    if (!Array.isArray(value)) return false;
    const itemType = parameterType.slice(0, -2);
    return value.every((item) => matchesParameterType(item, itemType));
  }

  switch (parameterType) {
    case "int":
      return typeof value === "number" && Number.isInteger(value);
    case "float64":
      return typeof value === "number";
    case "bool":
      return typeof value === "boolean";
    case "string":
      return typeof value === "string";
    default:
      return false;
  }
}

/**
 * Examples use the same JSON argument envelope as judge cases. Remove only
 * that transport-level envelope while preserving arrays that are real values.
 */
export function formatExampleInput(
  input: string,
  parameterTypes?: readonly string[],
): string {
  if (!parameterTypes?.length) return input;

  try {
    const argumentsEnvelope: unknown = JSON.parse(input);
    if (
      !Array.isArray(argumentsEnvelope) ||
      argumentsEnvelope.length !== parameterTypes.length ||
      !argumentsEnvelope.every((argument, index) =>
        matchesParameterType(argument, parameterTypes[index]),
      )
    ) {
      return input;
    }

    return argumentsEnvelope
      .map((argument) => JSON.stringify(argument))
      .join(", ");
  } catch {
    // Legacy examples may be descriptive text rather than JSON.
    return input;
  }
}
