import React, { useState } from 'react';
import { Button, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaShare, FaFacebook, FaTwitter, FaWhatsapp, FaEnvelope, FaLink } from 'react-icons/fa';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, title, description }) => {
  const [copied, setCopied] = useState(false);
  
  const fullUrl = `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" size="sm">
        <FaShare className="me-1" /> Share
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => handleShare('facebook')}>
          <FaFacebook className="me-2 text-primary" /> Facebook
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('twitter')}>
          <FaTwitter className="me-2 text-info" /> Twitter
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('whatsapp')}>
          <FaWhatsapp className="me-2 text-success" /> WhatsApp
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleShare('email')}>
          <FaEnvelope className="me-2" /> Email
        </Dropdown.Item>
        <Dropdown.Divider />
        <OverlayTrigger
          placement="top"
          show={copied}
          overlay={<Tooltip>Copied!</Tooltip>}
        >
          <Dropdown.Item onClick={copyToClipboard}>
            <FaLink className="me-2" /> {copied ? 'Copied!' : 'Copy Link'}
          </Dropdown.Item>
        </OverlayTrigger>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ShareButton;