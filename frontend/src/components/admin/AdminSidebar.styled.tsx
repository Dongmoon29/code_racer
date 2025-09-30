import styled from 'styled-components';
import Link from 'next/link';

export const Layout = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: hsl(var(--background));
`;

export const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid hsl(var(--border));
  display: flex;
  flex-direction: column;
`;

export const Brand = styled.div`
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid hsl(var(--border));
`;

export const Nav = styled.nav`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const NavSection = styled.div`
  margin-top: 12px;
`;

export const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px 10px;
  text-transform: uppercase;
`;

export const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: ${({ $active }) => ($active ? '#1d4ed8' : '#374151')};
  background: ${({ $active }) =>
    $active ? 'rgba(29,78,216,0.08)' : 'transparent'};
  border: ${({ $active }) =>
    $active ? '1px solid rgba(29,78,216,0.2)' : '1px solid transparent'};
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? 'rgba(29,78,216,0.12)' : '#f9fafb'};
    color: ${({ $active }) => ($active ? '#1d4ed8' : '#111827')};
  }
`;

export const Content = styled.main`
  min-height: 100vh;
  /* Force light background so we don't care about theme here */
  background: #f8fafc; /* gray-50 */
  color: #111827; /* gray-900 */
  padding: 24px;
`;
