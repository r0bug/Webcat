import React, { useState, useEffect } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { FiSave, FiRefreshCw, FiType, FiLayout, FiSettings } from 'react-icons/fi';
import { MdPalette } from 'react-icons/md';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSetting {
  id: number;
  value: any;
  type: string;
  description: string;
}

interface ThemeSettings {
  [category: string]: {
    [key: string]: ThemeSetting;
  };
}

const ThemeEditor: React.FC = () => {
  const { updateTheme, refreshTheme } = useTheme();
  const [settings, setSettings] = useState<ThemeSettings>({});
  const [rawSettings, setRawSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/theme');
      setSettings(response.data.settings);
      setRawSettings(response.data.raw);
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
    setHasChanges(true);

    // Update theme in real-time for preview
    updateTheme({ [key]: value });
  };

  const handleColorChange = (category: string, key: string, color: ColorResult) => {
    handleChange(category, key, color.hex);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare settings for API
      const settingsToUpdate: any[] = [];
      Object.entries(settings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, setting]) => {
          settingsToUpdate.push({
            id: setting.id,
            value: setting.value
          });
        });
      });

      await api.put('/theme', { settings: settingsToUpdate });
      await refreshTheme(); // Refresh theme from server
      setHasChanges(false);
      
      // Show success message (you might want to use a toast library)
      alert('Theme settings saved successfully!');
    } catch (error) {
      console.error('Failed to save theme settings:', error);
      alert('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (category?: string) => {
    if (!confirm(`Are you sure you want to reset ${category || 'all'} theme settings to defaults?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/theme/reset', { category });
      await fetchSettings();
      await refreshTheme();
      setHasChanges(false);
      alert(`Theme settings ${category ? `for ${category}` : ''} reset to defaults`);
    } catch (error) {
      console.error('Failed to reset theme settings:', error);
      alert('Failed to reset theme settings');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (category: string, key: string, setting: ThemeSetting) => {
    const { value, type, description } = setting;

    switch (type) {
      case 'color':
        return (
          <div className="relative">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="w-full px-3 py-2 border rounded-lg flex items-center justify-between"
                onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
              >
                <span>{value || 'Select color'}</span>
                <div className="w-6 h-6 rounded border" style={{ backgroundColor: value }} />
              </button>
            </div>
            {showColorPicker === key && (
              <div className="absolute z-10 mt-2">
                <div className="fixed inset-0" onClick={() => setShowColorPicker(null)} />
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
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(category, key, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(category, key, parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'boolean':
        return (
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(category, key, e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2">Enable</span>
          </label>
        );

      default:
        return null;
    }
  };

  const categoryIcons: { [key: string]: React.ReactNode } = {
    brand: <FiType className="w-5 h-5" />,
    colors: <MdPalette className="w-5 h-5" />,
    typography: <FiType className="w-5 h-5" />,
    layout: <FiLayout className="w-5 h-5" />,
    features: <FiSettings className="w-5 h-5" />
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading theme settings...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold">Theme Editor</h1>
          <p className="text-gray-600 mt-1">Customize the look and feel of your WebCat site</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50">
            <nav className="p-4">
              {Object.keys(settings).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`w-full text-left px-4 py-3 mb-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    activeTab === category
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {categoryIcons[category]}
                  <span className="capitalize">{category.replace('_', ' ')}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold capitalize">{activeTab.replace('_', ' ')} Settings</h2>
              <button
                onClick={() => handleReset(activeTab)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Reset {activeTab}</span>
              </button>
            </div>

            <div className="space-y-6">
              {settings[activeTab] && Object.entries(settings[activeTab]).map(([key, setting]) => (
                <div key={key} className="border-b pb-4 last:border-b-0">
                  <label className="block mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    {setting.description && (
                      <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                    )}
                  </label>
                  {renderSettingInput(activeTab, key, setting)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={() => handleReset()}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 flex items-center space-x-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Reset All</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <span className="text-sm text-orange-600">You have unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
                hasChanges && !saving
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditor;