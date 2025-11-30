import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Alert, Badge, InputGroup, Accordion } from 'react-bootstrap';
import { ChromePicker } from 'react-color';
import type { ColorResult } from 'react-color';
import { 
  FiSave, FiRefreshCw, FiType, FiLayout, FiSettings, FiSearch,
  FiEye, FiEyeOff, FiCopy, FiCheck, FiX, FiEdit2, FiFileText
} from 'react-icons/fi';
import { MdPalette, MdTextFields } from 'react-icons/md';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSetting {
  id: number;
  value: any;
  type: string;
  description: string;
  key: string;
}

interface ThemeSettings {
  [category: string]: {
    [key: string]: ThemeSetting;
  };
}

const ImprovedThemeEditor: React.FC = () => {
  const { updateTheme, refreshTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [searchTerm, setSearchTerm] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);
  const [savedAlert, setSavedAlert] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['nav_labels']));

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/theme');
      setSettings(response.settings || {});
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category][key],
          value
        }
      }
    }));
    
    setChangedSettings(prev => new Set([...prev, `${category}.${key}`]));
    setHasChanges(true);

    // Update theme in real-time for preview
    if (category === 'colors' || category === 'typography') {
      updateTheme({ [key]: value });
    }
  };

  const handleColorChange = (category: string, key: string, color: ColorResult) => {
    handleChange(category, key, color.hex);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settingsToUpdate: any[] = [];
      Object.entries(settings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, setting]) => {
          if (changedSettings.has(`${category}.${key}`)) {
            settingsToUpdate.push({
              id: setting.id,
              value: setting.value
            });
          }
        });
      });

      await api.put('/theme', { settings: settingsToUpdate });
      await refreshTheme();
      setHasChanges(false);
      setChangedSettings(new Set());
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    } catch (error) {
      console.error('Failed to save theme settings:', error);
      alert('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (category?: string, key?: string) => {
    const resetTarget = key ? `"${key}"` : category ? `all ${category} settings` : 'all theme settings';
    if (!confirm(`Reset ${resetTarget} to default?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/theme/reset', { category, key });
      await fetchSettings();
      await refreshTheme();
      setHasChanges(false);
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to reset theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Group content settings by subcategory
  const groupedContentSettings = useMemo(() => {
    if (!settings.content) return {};
    
    const groups: { [key: string]: { [key: string]: ThemeSetting } } = {
      page_titles: {},
      nav_labels: {},
      buttons: {},
      forms: {},
      status: {},
      messages: {},
      placeholders: {},
      detail_page: {},
      footer: {},
      other: {}
    };

    Object.entries(settings.content).forEach(([key, setting]) => {
      if (key.startsWith('page_title_')) groups.page_titles[key] = setting;
      else if (key.startsWith('nav_')) groups.nav_labels[key] = setting;
      else if (key.startsWith('btn_')) groups.buttons[key] = setting;
      else if (key.startsWith('form_')) groups.forms[key] = setting;
      else if (key.startsWith('status_')) groups.status[key] = setting;
      else if (key.startsWith('msg_')) groups.messages[key] = setting;
      else if (key.startsWith('placeholder_')) groups.placeholders[key] = setting;
      else if (key.startsWith('detail_')) groups.detail_page[key] = setting;
      else if (key.startsWith('footer_')) groups.footer[key] = setting;
      else groups.other[key] = setting;
    });

    return groups;
  }, [settings.content]);

  // Filter settings based on search
  const filteredSettings = useMemo(() => {
    if (!searchTerm) return settings;
    
    const filtered: ThemeSettings = {};
    Object.entries(settings).forEach(([category, categorySettings]) => {
      const filteredCategory: { [key: string]: ThemeSetting } = {};
      Object.entries(categorySettings).forEach(([key, setting]) => {
        if (
          key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          setting.value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          filteredCategory[key] = setting;
        }
      });
      if (Object.keys(filteredCategory).length > 0) {
        filtered[category] = filteredCategory;
      }
    });
    return filtered;
  }, [settings, searchTerm]);

  const renderSettingInput = (category: string, key: string, setting: ThemeSetting) => {
    const { value, type, description } = setting;
    const isChanged = changedSettings.has(`${category}.${key}`);

    switch (type) {
      case 'color':
        return (
          <div className="position-relative">
            <InputGroup>
              <Form.Control
                type="text"
                value={value || ''}
                onChange={(e) => handleChange(category, key, e.target.value)}
                style={{ borderRight: 'none' }}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                style={{ 
                  backgroundColor: value,
                  borderLeft: 'none',
                  width: '50px'
                }}
              />
              {isChanged && <Badge bg="warning" className="position-absolute top-0 end-0">Modified</Badge>}
            </InputGroup>
            {showColorPicker === key && (
              <div className="position-absolute" style={{ zIndex: 1000 }}>
                <div 
                  className="position-fixed top-0 start-0 w-100 h-100" 
                  onClick={() => setShowColorPicker(null)}
                />
                <ChromePicker
                  color={value || '#000000'}
                  onChange={(color) => handleColorChange(category, key, color)}
                />
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="position-relative">
            <InputGroup>
              <Form.Control
                type="text"
                value={value || ''}
                onChange={(e) => handleChange(category, key, e.target.value)}
                placeholder={description}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => copyToClipboard(value)}
                title="Copy to clipboard"
              >
                <FiCopy />
              </Button>
              {isChanged && <Badge bg="warning" className="position-absolute top-0 end-0">Modified</Badge>}
            </InputGroup>
          </div>
        );

      case 'number':
        return (
          <div className="position-relative">
            <Form.Control
              type="number"
              value={value || 0}
              onChange={(e) => handleChange(category, key, parseInt(e.target.value))}
            />
            {isChanged && <Badge bg="warning" className="position-absolute top-0 end-0">Modified</Badge>}
          </div>
        );

      case 'boolean':
        return (
          <div className="position-relative">
            <Form.Check
              type="switch"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(category, key, e.target.checked)}
              label={value ? 'Enabled' : 'Disabled'}
            />
            {isChanged && <Badge bg="warning" className="position-absolute top-0 end-0">Modified</Badge>}
          </div>
        );

      default:
        return null;
    }
  };

  const renderContentSection = (sectionName: string, sectionSettings: { [key: string]: ThemeSetting }) => {
    if (Object.keys(sectionSettings).length === 0) return null;

    const sectionLabels: { [key: string]: string } = {
      page_titles: '📄 Page Titles',
      nav_labels: '🧭 Navigation Labels',
      buttons: '🔘 Button Text',
      forms: '📝 Form Labels',
      status: '🏷️ Status Labels',
      messages: '💬 Messages',
      placeholders: '✏️ Placeholder Text',
      detail_page: '📋 Item Detail Page',
      footer: '📍 Footer Text',
      other: '📦 Other'
    };

    return (
      <Card className="mb-3">
        <Card.Header 
          className="d-flex justify-content-between align-items-center cursor-pointer"
          onClick={() => toggleSection(sectionName)}
          style={{ cursor: 'pointer' }}
        >
          <h6 className="mb-0">{sectionLabels[sectionName] || sectionName}</h6>
          <Badge bg="secondary">{Object.keys(sectionSettings).length}</Badge>
        </Card.Header>
        {expandedSections.has(sectionName) && (
          <Card.Body>
            {Object.entries(sectionSettings).map(([key, setting]) => (
              <Form.Group key={key} className="mb-3">
                <Form.Label className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</strong>
                    {setting.description && (
                      <small className="text-muted d-block">{setting.description}</small>
                    )}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset('content', key);
                    }}
                  >
                    <FiRefreshCw size={14} />
                  </Button>
                </Form.Label>
                {renderSettingInput('content', key, setting)}
              </Form.Group>
            ))}
          </Card.Body>
        )}
      </Card>
    );
  };

  const categoryIcons: { [key: string]: React.ReactNode } = {
    brand: <FiType />,
    colors: <MdPalette />,
    typography: <MdTextFields />,
    layout: <FiLayout />,
    features: <FiSettings />,
    content: <FiFileText />
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading theme settings...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Theme & Content Editor</h4>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <FiEyeOff /> : <FiEye />} Preview
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleReset()}
                  >
                    <FiRefreshCw /> Reset All
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                  >
                    <FiSave className="me-2" />
                    {saving ? 'Saving...' : `Save Changes ${hasChanges ? `(${changedSettings.size})` : ''}`}
                  </Button>
                </div>
              </div>
            </Card.Header>

            <Card.Body>
              {savedAlert && (
                <Alert variant="success" dismissible onClose={() => setSavedAlert(false)}>
                  <FiCheck className="me-2" />
                  Theme settings saved successfully!
                </Alert>
              )}

              <Row className="mb-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search settings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSearchTerm('')}
                      >
                        <FiX />
                      </Button>
                    )}
                  </InputGroup>
                </Col>
              </Row>

              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'content')}>
                <Nav variant="tabs" className="mb-3">
                  {Object.keys(filteredSettings).map(category => (
                    <Nav.Item key={category}>
                      <Nav.Link eventKey={category}>
                        <span className="d-flex align-items-center gap-2">
                          {categoryIcons[category]}
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                          {category === 'content' && (
                            <Badge bg="primary">New</Badge>
                          )}
                        </span>
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>

                <Tab.Content>
                  {activeTab === 'content' ? (
                    <Tab.Pane eventKey="content">
                      {Object.entries(groupedContentSettings).map(([sectionName, sectionSettings]) => 
                        renderContentSection(sectionName, sectionSettings)
                      )}
                    </Tab.Pane>
                  ) : (
                    Object.entries(filteredSettings).map(([category, categorySettings]) => (
                      <Tab.Pane key={category} eventKey={category}>
                        <Row>
                          {Object.entries(categorySettings).map(([key, setting]) => (
                            <Col md={6} key={key}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  <strong>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</strong>
                                  {setting.description && (
                                    <small className="text-muted d-block">{setting.description}</small>
                                  )}
                                </Form.Label>
                                {renderSettingInput(category, key, setting)}
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>
                      </Tab.Pane>
                    ))
                  )}
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ImprovedThemeEditor;