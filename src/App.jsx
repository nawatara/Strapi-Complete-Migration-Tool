import React, { useState } from 'react';
import { Upload, Download, RefreshCw, CheckCircle, AlertCircle, Copy, Image, FileText, Layers } from 'lucide-react';
import "./App.css"

const StrapiMigrationTool = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [oldUrl, setOldUrl] = useState('https://better-creativity-69d909957a.strapiapp.com');
  const [newUrl, setNewUrl] = useState('https://strapi.nawatara.com');
  const [oldToken, setOldToken] = useState('');
  const [newToken, setNewToken] = useState('');
  const [status, setStatus] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ old: null, new: null });
  const [migrationStats, setMigrationStats] = useState({
    totalItems: 0,
    successItems: 0,
    failedItems: 0,
    totalMedia: 0,
    successMedia: 0,
    failedMedia: 0
  });

  const [selectedTypes, setSelectedTypes] = useState({
    'api::article.article': true,
    'api::author.author': false,
    'api::best-service.best-service': false,
    'api::category.category': false,
    'api::certificate.certificate': false,
    'api::display-event.display-event': false,
    'api::job-vacancy.job-vacancy': false,
    'api::nawatara-client.nawatara-client': false,
    'api::promotion.promotion': false,
    'api::slider-promotion.slider-promotion': false,
    'api::slider-youtube.slider-youtube': false,
    'api::special-product-nawatara.special-product-nawatara': false,
    'api::tag.tag': false,
    'api::user.user': false,
    'api::about.about': true,
    'api::global.global': false
  });

  const collectionTypes = [
    { id: 'api::article.article', label: 'Article', endpoint: 'articles' },
    { id: 'api::author.author', label: 'Author', endpoint: 'authors' },
    { id: 'api::best-service.best-service', label: 'Best Service', endpoint: 'best-services' },
    { id: 'api::category.category', label: 'Category', endpoint: 'categories' },
    { id: 'api::certificate.certificate', label: 'Certificate', endpoint: 'certificates' },
    { id: 'api::display-event.display-event', label: 'Display Event', endpoint: 'display-events' },
    { id: 'api::job-vacancy.job-vacancy', label: 'Job Vacancy', endpoint: 'job-vacancies' },
    { id: 'api::nawatara-client.nawatara-client', label: 'Nawatara Client', endpoint: 'nawatara-clients' },
    { id: 'api::promotion.promotion', label: 'Promotion', endpoint: 'promotions' },
    { id: 'api::slider-promotion.slider-promotion', label: 'Slider Promotion', endpoint: 'slider-promotions' },
    { id: 'api::slider-youtube.slider-youtube', label: 'Slider Youtube', endpoint: 'slider-youtubes' },
    { id: 'api::special-product-nawatara.special-product-nawatara', label: 'Special Product Nawatara', endpoint: 'special-product-nawataras' },
    { id: 'api::tag.tag', label: 'Tag', endpoint: 'tags' },
    { id: 'api::user.user', label: 'User', endpoint: 'users' }
  ];

  const singleTypes = [
    { id: 'api::about.about', label: 'About', endpoint: 'about' },
    { id: 'api::global.global', label: 'Global', endpoint: 'global' }
  ];

  const getEndpoint = (contentTypeId) => {
    const found = [...collectionTypes, ...singleTypes].find(t => t.id === contentTypeId);
    return found ? found.endpoint : contentTypeId.split('::')[1].split('.')[1];
  };

  const testConnection = async () => {
    setIsTesting(true);
    setStatus([]);
    addStatus('🔍 Testing connections...', 'info');

    // Test Old Strapi
    try {
      addStatus(`Testing OLD Strapi: ${oldUrl}`, 'info');
      
      // Test without auth first
      try {
        const testResponse = await fetch(`${oldUrl}/api/articles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (testResponse.status === 403) {
          addStatus('⚠️ Old Strapi: Public access forbidden (this is normal)', 'warning');
        } else if (testResponse.ok) {
          addStatus('✓ Old Strapi: Public access works!', 'success');
        }
      } catch (e) {
        addStatus(`✗ Old Strapi public test failed: ${e.message}`, 'error');
      }

      // Test with auth
      if (oldToken) {
        try {
          const authResponse = await fetch(`${oldUrl}/api/articles?pagination[limit]=1`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${oldToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (authResponse.ok) {
            const data = await authResponse.json();
            addStatus(`✓ Old Strapi: Authentication SUCCESS! Found ${data.data?.length || 0} articles`, 'success');
            setConnectionStatus(prev => ({ ...prev, old: 'success' }));
          } else {
            const errorText = await authResponse.text();
            addStatus(`✗ Old Strapi: Auth failed (${authResponse.status}): ${errorText}`, 'error');
            setConnectionStatus(prev => ({ ...prev, old: 'error' }));
          }
        } catch (e) {
          addStatus(`✗ Old Strapi auth test failed: ${e.message}`, 'error');
          setConnectionStatus(prev => ({ ...prev, old: 'error' }));
        }
      } else {
        addStatus('⚠️ Old Strapi: No token provided for auth test', 'warning');
      }
    } catch (error) {
      addStatus(`✗ Old Strapi connection failed: ${error.message}`, 'error');
      setConnectionStatus(prev => ({ ...prev, old: 'error' }));
    }

    // Test New Strapi
    try {
      addStatus(`Testing NEW Strapi: ${newUrl}`, 'info');
      
      if (newToken) {
        try {
          const authResponse = await fetch(`${newUrl}/api/articles?pagination[limit]=1`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (authResponse.ok) {
            const data = await authResponse.json();
            addStatus(`✓ New Strapi: Authentication SUCCESS! Ready to receive data`, 'success');
            setConnectionStatus(prev => ({ ...prev, new: 'success' }));
          } else {
            const errorText = await authResponse.text();
            addStatus(`✗ New Strapi: Auth failed (${authResponse.status}): ${errorText}`, 'error');
            setConnectionStatus(prev => ({ ...prev, new: 'error' }));
          }
        } catch (e) {
          addStatus(`✗ New Strapi auth test failed: ${e.message}`, 'error');
          setConnectionStatus(prev => ({ ...prev, new: 'error' }));
        }
      } else {
        addStatus('⚠️ New Strapi: No token provided for auth test', 'warning');
      }
    } catch (error) {
      addStatus(`✗ New Strapi connection failed: ${error.message}`, 'error');
      setConnectionStatus(prev => ({ ...prev, new: 'error' }));
    }

    setIsTesting(false);
    
    if (connectionStatus.old === 'success' && connectionStatus.new === 'success') {
      addStatus('🎉 Both connections successful! Ready to migrate.', 'success');
    } else {
      addStatus('❌ Connection issues detected. Please fix before migrating.', 'error');
    }
  };

  const addStatus = (message, type = 'info') => {
    setStatus(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const updateStats = (field, increment = 1) => {
    setMigrationStats(prev => ({
      ...prev,
      [field]: prev[field] + increment
    }));
  };

  const fetchFromOldStrapi = async (endpoint, params = '', retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const url = `${oldUrl}/api/${endpoint}${params}`;
        addStatus(`🔗 Connecting to: ${url}`, 'info');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${oldToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        addStatus(`⚠️ Attempt ${i + 1}/${retries} failed: ${error.message}`, 'warning');
        
        if (i === retries - 1) {
          throw new Error(`Failed after ${retries} attempts: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const uploadToNewStrapi = async (endpoint, data, method = 'POST', retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const url = `${newUrl}/api/${endpoint}`;
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ data }),
          mode: 'cors'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        addStatus(`⚠️ Upload attempt ${i + 1}/${retries} failed: ${error.message}`, 'warning');
        
        if (i === retries - 1) {
          throw new Error(`Failed to upload after ${retries} attempts: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const uploadMedia = async (file, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        updateStats('totalMedia');
        addStatus(`📥 Downloading: ${file.name} (attempt ${i + 1}/${retries})`, 'info');
        
        const fileUrl = file.url.startsWith('http') ? file.url : `${oldUrl}${file.url}`;
        const fileResponse = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${oldToken}`
          },
          mode: 'cors'
        });
        
        if (!fileResponse.ok) {
          throw new Error(`Failed to download file: ${file.name} - HTTP ${fileResponse.status}`);
        }
        
        const blob = await fileResponse.blob();
        const formData = new FormData();
        formData.append('files', blob, file.name);
        
        if (file.caption) formData.append('fileInfo', JSON.stringify({ caption: file.caption }));
        if (file.alternativeText) formData.append('fileInfo', JSON.stringify({ alternativeText: file.alternativeText }));
        
        addStatus(`📤 Uploading: ${file.name}`, 'info');
        const uploadResponse = await fetch(`${newUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`
          },
          body: formData,
          mode: 'cors'
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload file: ${file.name} - ${errorText}`);
        }
        
        const result = await uploadResponse.json();
        updateStats('successMedia');
        addStatus(`✓ Media uploaded: ${file.name}`, 'success');
        return result;
      } catch (error) {
        addStatus(`⚠️ Attempt ${i + 1}/${retries} failed for ${file.name}: ${error.message}`, 'warning');
        
        if (i === retries - 1) {
          updateStats('failedMedia');
          addStatus(`✗ Error uploading ${file.name} after ${retries} attempts`, 'error');
          return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const processMediaFields = async (data) => {
    const processedData = { ...data };
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object') {
        if (value.url && value.mime) {
          const uploaded = await uploadMedia(value);
          if (uploaded && uploaded[0]) {
            processedData[key] = uploaded[0].id;
          }
        } else if (Array.isArray(value) && value.length > 0 && value[0]?.url) {
          const uploadedIds = [];
          for (const item of value) {
            const uploaded = await uploadMedia(item);
            if (uploaded && uploaded[0]) {
              uploadedIds.push(uploaded[0].id);
            }
          }
          processedData[key] = uploadedIds;
        } else if (!Array.isArray(value) && !value.url) {
          processedData[key] = await processMediaFields(value);
        }
      }
    }
    
    return processedData;
  };

  const migrateContentType = async (contentType) => {
    try {
      const endpoint = getEndpoint(contentType);
      addStatus(`🔍 Fetching data from ${contentType} (endpoint: ${endpoint})...`, 'info');
      
      // Try with populate=deep first, fallback to populate=* if fails
      let oldData;
      try {
        oldData = await fetchFromOldStrapi(endpoint, '?populate=deep');
      } catch (deepError) {
        addStatus(`⚠️ Deep populate failed, trying basic populate...`, 'warning');
        oldData = await fetchFromOldStrapi(endpoint, '?populate=*');
      }
      
      if (!oldData.data) {
        addStatus(`⚠️ No data found for ${endpoint}`, 'warning');
        return;
      }

      const items = Array.isArray(oldData.data) ? oldData.data : [oldData.data];
      addStatus(`📦 Found ${items.length} item(s) in ${endpoint}`, 'info');

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        try {
          updateStats('totalItems');
          const attributes = item.attributes || item;
          
          addStatus(`🔄 Processing item ${index + 1}/${items.length} from ${endpoint}...`, 'info');
          
          const cleanData = { ...attributes };
          delete cleanData.id;
          delete cleanData.createdAt;
          delete cleanData.updatedAt;
          delete cleanData.publishedAt;
          
          const processedData = await processMediaFields(cleanData);
          
          await uploadToNewStrapi(endpoint, processedData);
          updateStats('successItems');
          addStatus(`✓ Successfully migrated item ${index + 1}/${items.length} from ${endpoint}`, 'success');
        } catch (error) {
          updateStats('failedItems');
          addStatus(`✗ Error migrating item ${index + 1}: ${error.message}`, 'error');
        }
      }
    } catch (error) {
      const endpoint = getEndpoint(contentType);
      addStatus(`✗ Error with ${contentType}: ${error.message}`, 'error');
      
      // Provide helpful debugging info
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        addStatus(`💡 Troubleshooting tips:`, 'info');
        addStatus(`   1. Test this URL in browser: ${oldUrl}/api/${endpoint}`, 'info');
        addStatus(`   2. Verify API tokens are valid (Settings → API Tokens → Full Access)`, 'info');
        addStatus(`   3. Check content type permissions (Settings → Roles → Public → find & findOne enabled)`, 'info');
        addStatus(`   4. Ensure CORS is enabled in config/middlewares.js`, 'info');
      }
    }
  };

  const migrateAllMedia = async () => {
    try {
      addStatus('🖼️ Starting Media Library migration...', 'info');
      
      let page = 1;
      let hasMore = true;
      let allMedia = [];

      while (hasMore) {
        addStatus(`📄 Fetching media page ${page}...`, 'info');
        const mediaData = await fetchFromOldStrapi('upload/files', `?pagination[page]=${page}&pagination[pageSize]=100`);
        
        if (mediaData.data && mediaData.data.length > 0) {
          allMedia = [...allMedia, ...mediaData.data];
          page++;
          hasMore = mediaData.meta?.pagination?.pageCount > page - 1;
        } else {
          hasMore = false;
        }
      }

      addStatus(`📊 Found ${allMedia.length} media files to migrate`, 'info');

      for (const media of allMedia) {
        await uploadMedia(media);
      }

      addStatus('✓ Media Library migration completed!', 'success');
    } catch (error) {
      addStatus(`✗ Error migrating Media Library: ${error.message}`, 'error');
    }
  };

  const startContentMigration = async () => {
    if (!oldToken || !newToken) {
      addStatus('❌ Please provide both API tokens', 'error');
      return;
    }

    const selectedTypesList = Object.entries(selectedTypes)
      .filter(([_, isSelected]) => isSelected)
      .map(([typeId, _]) => typeId);

    if (selectedTypesList.length === 0) {
      addStatus('❌ Please select at least one content type', 'error');
      return;
    }

    setIsProcessing(true);
    setStatus([]);
    setMigrationStats({
      totalItems: 0,
      successItems: 0,
      failedItems: 0,
      totalMedia: 0,
      successMedia: 0,
      failedMedia: 0
    });

    addStatus(`🚀 Starting Content Manager migration for ${selectedTypesList.length} content type(s)...`, 'info');
    
    for (const contentType of selectedTypesList) {
      await migrateContentType(contentType);
    }

    addStatus('🎉 Content Manager migration completed!', 'success');
    setIsProcessing(false);
  };

  const startMediaMigration = async () => {
    if (!oldToken || !newToken) {
      addStatus('❌ Please provide both API tokens', 'error');
      return;
    }

    setIsProcessing(true);
    setStatus([]);
    setMigrationStats({
      totalItems: 0,
      successItems: 0,
      failedItems: 0,
      totalMedia: 0,
      successMedia: 0,
      failedMedia: 0
    });

    await migrateAllMedia();
    setIsProcessing(false);
  };

  const startCompleteMigration = async () => {
    if (!oldToken || !newToken) {
      addStatus('❌ Please provide both API tokens', 'error');
      return;
    }

    const selectedTypesList = Object.entries(selectedTypes)
      .filter(([_, isSelected]) => isSelected)
      .map(([typeId, _]) => typeId);

    if (selectedTypesList.length === 0) {
      addStatus('❌ Please select at least one content type', 'error');
      return;
    }

    setIsProcessing(true);
    setStatus([]);
    setMigrationStats({
      totalItems: 0,
      successItems: 0,
      failedItems: 0,
      totalMedia: 0,
      successMedia: 0,
      failedMedia: 0
    });

    addStatus('🚀 Starting COMPLETE migration (Media Library + Content Manager)...', 'info');
    
    await migrateAllMedia();
    
    addStatus('', 'info');
    addStatus('📝 Now migrating Content Manager...', 'info');
    
    for (const contentType of selectedTypesList) {
      await migrateContentType(contentType);
    }

    addStatus('', 'info');
    addStatus('🎉 COMPLETE migration finished!', 'success');
    setIsProcessing(false);
  };

  const toggleContentType = (typeId) => {
    setSelectedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  const toggleAll = (checked) => {
    const newSelected = {};
    Object.keys(selectedTypes).forEach(key => {
      newSelected[key] = checked;
    });
    setSelectedTypes(newSelected);
  };

  const getStatusIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <RefreshCw className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-10 h-10" />
              <h1 className="text-4xl font-bold">Strapi Complete Migration Tool</h1>
            </div>
            <p className="text-indigo-100">Migrate Content Manager & Media Library with ease</p>
          </div>

          <div className="p-8">
            {/* Configuration Section */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <Upload className="w-5 h-5 text-red-500" />
                  Source Strapi (Lama)
                  {connectionStatus.old === 'success' && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                  {connectionStatus.old === 'error' && <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Strapi Lama
                  </label>
                  <input
                    type="text"
                    value={oldUrl}
                    onChange={(e) => setOldUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token Lama
                  </label>
                  <input
                    type="password"
                    value={oldToken}
                    onChange={(e) => setOldToken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <Download className="w-5 h-5 text-green-500" />
                  Destination Strapi (Baru)
                  {connectionStatus.new === 'success' && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                  {connectionStatus.new === 'error' && <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Strapi Baru
                  </label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token Baru
                  </label>
                  <input
                    type="password"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="mb-6">
              <button
                onClick={testConnection}
                disabled={isTesting || isProcessing}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                  isTesting || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isTesting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Testing Connections...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Test Connection & API Tokens
                  </span>
                )}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === 'content'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Content Manager
                </div>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === 'media'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Media Library
                </div>
              </button>
              <button
                onClick={() => setActiveTab('complete')}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === 'complete'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Complete Migration
                </div>
              </button>
            </div>

            {/* Content Manager Tab */}
            {activeTab === 'content' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Pilih Content Types untuk Migrasi
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAll(true)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => toggleAll(false)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm uppercase">
                      Collection Types
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {collectionTypes.map(type => (
                        <label key={type.id} className="flex items-center gap-3 cursor-pointer hover:bg-blue-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedTypes[type.id]}
                            onChange={() => toggleContentType(type.id)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3 text-sm uppercase">
                      Single Types
                    </h4>
                    <div className="space-y-2">
                      {singleTypes.map(type => (
                        <label key={type.id} className="flex items-center gap-3 cursor-pointer hover:bg-purple-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedTypes[type.id]}
                            onChange={() => toggleContentType(type.id)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Selected:</strong> {Object.values(selectedTypes).filter(Boolean).length} content type(s)
                  </p>
                </div>

                <button
                  onClick={startContentMigration}
                  disabled={isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Migrating Content...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5" />
                      Migrate Content Manager
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Media Library Tab */}
            {activeTab === 'media' && (
              <div>
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-4">
                    <Image className="w-12 h-12 text-purple-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Media Library Migration
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Tool ini akan memigrasikan seluruh file dari Media Library Strapi lama ke Strapi baru, termasuk:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Semua gambar (JPEG, PNG, GIF, WebP, SVG)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Dokumen (PDF, DOC, XLS, PPT)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Video dan audio files
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          File metadata (caption, alternative text)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startMediaMigration}
                  disabled={isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Migrating Media...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Image className="w-5 h-5" />
                      Migrate Media Library
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Complete Migration Tab */}
            {activeTab === 'complete' && (
              <div>
                <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start gap-4">
                    <Layers className="w-12 h-12 text-indigo-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Complete Migration (Recommended)
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Migrasi lengkap akan menjalankan proses berikut secara berurutan:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm font-bold">1</div>
                          <div>
                            <p className="font-semibold text-gray-800">Media Library Migration</p>
                            <p className="text-sm text-gray-600">Migrate semua file dari Media Library terlebih dahulu</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm font-bold">2</div>
                          <div>
                            <p className="font-semibold text-gray-800">Content Manager Migration</p>
                            <p className="text-sm text-gray-600">Migrate content dengan relasi media yang sudah tersedia</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Select Content Types:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-h-60 overflow-y-auto">
                      <p className="font-semibold text-blue-900 mb-2 text-sm">Collection Types</p>
                      {collectionTypes.map(type => (
                        <label key={type.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded text-sm">
                          <input
                            type="checkbox"
                            checked={selectedTypes[type.id]}
                            onChange={() => toggleContentType(type.id)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2 text-sm">Single Types</p>
                      {singleTypes.map(type => (
                        <label key={type.id} className="flex items-center gap-2 cursor-pointer hover:bg-purple-100 p-1 rounded text-sm">
                          <input
                            type="checkbox"
                            checked={selectedTypes[type.id]}
                            onChange={() => toggleContentType(type.id)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={() => toggleAll(true)} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200">
                      Select All
                    </button>
                    <button onClick={() => toggleAll(false)} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      Deselect All
                    </button>
                  </div>
                </div>

                <button
                  onClick={startCompleteMigration}
                  disabled={isProcessing}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing Complete Migration...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Layers className="w-5 h-5" />
                      Start Complete Migration (Media + Content)
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Migration Stats */}
            {(migrationStats.totalItems > 0 || migrationStats.totalMedia > 0) && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{migrationStats.totalItems}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Success Items</p>
                  <p className="text-2xl font-bold text-green-900">{migrationStats.successItems}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Failed Items</p>
                  <p className="text-2xl font-bold text-red-900">{migrationStats.failedItems}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Total Media</p>
                  <p className="text-2xl font-bold text-purple-900">{migrationStats.totalMedia}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Success Media</p>
                  <p className="text-2xl font-bold text-green-900">{migrationStats.successMedia}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Failed Media</p>
                  <p className="text-2xl font-bold text-red-900">{migrationStats.failedMedia}</p>
                </div>
              </div>
            )}

            {/* Status Log */}
            {status.length > 0 && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Migration Log
                </h3>
                <div className="space-y-2">
                  {status.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      {getStatusIcon(log.type)}
                      <span className="text-gray-500 text-xs min-w-[60px]">{log.time}</span>
                      <span className={`flex-1 ${
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'success' ? 'text-green-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        'text-gray-700'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Panduan Penggunaan
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-1">1. Setup API Tokens</p>
                  <p className="ml-4">Buat API Token di Settings → API Tokens dengan permission <strong>Full Access</strong></p>
                </div>
                <div>
                  <p className="font-semibold mb-1">2. Test Connection DULU!</p>
                  <p className="ml-4">Klik tombol <strong>"Test Connection & API Tokens"</strong> untuk memastikan koneksi berhasil</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">3. Jika Test Gagal, Check Ini:</p>
                  <ul className="ml-4 space-y-1 list-disc list-inside">
                    <li>Di Strapi LAMA: Settings → Roles → Authenticated → Enable ALL permissions untuk semua content types</li>
                    <li>API Token harus <strong>Full Access</strong> atau <strong>Custom</strong> dengan all permissions</li>
                    <li>Browser extension (AdBlock, Privacy Badger) bisa block request - coba disable</li>
                    <li>Pastikan tidak ada firewall/network policy yang block cross-origin requests</li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-50 rounded border border-amber-200 mt-2">
                  <p className="font-semibold text-amber-900 mb-1">⚠️ Common Issue: CORS / Network Error</p>
                  <p className="text-amber-800 text-xs">Jika browser Anda masih mendapat NetworkError meski test koneksi sukses di browser biasa, ini adalah <strong>browser security policy</strong>. Solusi:</p>
                  <ul className="text-amber-800 text-xs ml-4 mt-1 space-y-1">
                    <li>1. Export data manual dari Strapi lama via admin panel</li>
                    <li>2. Atau jalankan tool ini dari server/localhost (bukan dari claude.ai)</li>
                    <li>3. Atau gunakan Strapi Import/Export plugin</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrapiMigrationTool;