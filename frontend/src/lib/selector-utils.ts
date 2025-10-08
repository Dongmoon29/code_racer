/**
 * Get ring color class based on option value
 * @param value - The option value
 * @param type - The type of selector ('mode' | 'difficulty')
 * @returns Tailwind ring color class
 */
export function getRingColorClass(
  value: string,
  type: 'mode' | 'difficulty'
): string {
  if (type === 'mode') {
    switch (value) {
      case 'casual_pvp':
        return 'ring-green-500';
      case 'ranked_pvp':
        return 'ring-yellow-500';
      case 'single':
        return 'ring-red-500';
      default:
        return 'ring-gray-500';
    }
  }

  if (type === 'difficulty') {
    switch (value) {
      case 'Easy':
        return 'ring-green-500';
      case 'Medium':
        return 'ring-yellow-500';
      case 'Hard':
        return 'ring-red-500';
      default:
        return 'ring-gray-500';
    }
  }

  return 'ring-gray-500';
}

/**
 * Get ring classes for selected state
 * @param isSelected - Whether the option is selected
 * @param value - The option value
 * @param type - The type of selector ('mode' | 'difficulty')
 * @returns Complete ring classes string
 */
export function getRingClasses(
  isSelected: boolean,
  value: string,
  type: 'mode' | 'difficulty'
): string {
  if (!isSelected) return '';

  const ringColor = getRingColorClass(value, type);
  return `ring-2 ${ringColor}`;
}
