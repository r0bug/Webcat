import React from 'react';
import { Container } from 'react-bootstrap';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <div className="row">
          <div className="col-md-6">
            <h5>WebCat</h5>
            <p className="mb-0">Consignment Mall Catalog System</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">© {new Date().getFullYear()} WebCat. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;