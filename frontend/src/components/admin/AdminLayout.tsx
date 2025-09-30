import React from 'react';
import { useRouter } from 'next/router';
import {
  Layout,
  Sidebar,
  Brand,
  Nav,
  NavSection,
  SectionLabel,
  NavLink,
  Content,
} from './AdminSidebar.styled';

type Props = {
  children: React.ReactNode;
};

const items = [
  { href: '/admin', label: 'Overview', icon: '🏠' },
  { href: '/admin/leetcode', label: 'LeetCode', icon: '📝' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  return (
    <Layout>
      <Sidebar>
        <Brand>Admin Panel</Brand>
        <Nav>
          <NavSection>
            <SectionLabel>Management</SectionLabel>
            {items.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? router.pathname === '/admin'
                  : router.pathname.startsWith(item.href);
              return (
                <NavLink key={item.href} href={item.href} $active={isActive}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </NavSection>
        </Nav>
      </Sidebar>
      <Content>{children}</Content>
    </Layout>
  );
}
