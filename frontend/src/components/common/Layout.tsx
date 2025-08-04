import React from 'react';
import { Container } from 'react-bootstrap';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation />
      <main className="flex-grow-1">
        <Container fluid className="py-4">
          {children}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;