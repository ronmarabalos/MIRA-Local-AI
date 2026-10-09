import { Text, type TextProps } from 'react-native';

const HAS_FONT = /(^|\s)font-(light|normal|medium|semibold|bold)(\s|$)/;
const HAS_COLOR =
  /(^|\s)text-(white|black|transparent|ink|navy|peri|mint|success|warning|error|outlook|dk)\b/;

/**
 * Text in Onest, ink by default. Pass Tailwind classes as usual; a `font-*`
 * or colour class replaces the default instead of competing with it.
 */
export function T({ className = '', ...props }: TextProps) {
  const base =
    (HAS_FONT.test(className) ? '' : 'font-normal ') +
    (HAS_COLOR.test(className) ? '' : 'text-ink ');
  return <Text {...props} className={base + className} />;
}
