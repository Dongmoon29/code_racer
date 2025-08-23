import 'styled-components';
import { Theme } from './theme';

declare module 'styled-components' {
  export type DefaultTheme = Theme;
}
