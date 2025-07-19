import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Upload, 
  Settings, 
  Server, 
  ArrowRight, 
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Users,
  Calendar,
  Filter,
  Search,
  FileText,
  Target,
  RefreshCw,
  Menu,
  X,
  Info,
  Zap
} from 'lucide-react';

// Import the actual view components
import DashboardView from './views/DashboardView';
import LifecyclePlannerView from './views/LifecyclePlannerView';
import MigrationPlannerView from './views/MigrationPlannerView';
import SettingsView from './views/SettingsView';

const InfraPlanner = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isDataUploaded, setIsDataUploaded] = useState(false);
  const [activeTab, setActiveTab] = useState('clusters');
  const [lifecyclePlannerStep, setLifecyclePlannerStep] = useState(1);
  const [migrationPlannerStep, setMigrationPlannerStep] = useState(1);
  const [activeSettingsTab, setActiveSettingsTab] = useState('hardware');
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Load Poppins font and inject keyframes
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Inject Fluent 2 global styles and keyframes
    const style = document.createElement('style');
    style.textContent = `
      /* Fluent 2 Global Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: "Poppins", "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        background: linear-gradient(135deg, #f4ebf0 0%, #f0eaf4 16.66%, #eeeff8 33.33%, #e8f2f8 50%, #eaf6f4 66.66%, #f0f8fa 83.33%, #f4ebf0 100%);
        background-size: 600% 600%;
        animation: gradientFlow 24s ease-in-out infinite;
        color: rgba(36, 36, 36, 1);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      @keyframes gradientFlow {
        0% { background-position: 20% 20%; }
        25% { background-position: 80% 20%; }
        50% { background-position: 80% 80%; }
        75% { background-position: 20% 80%; }
        100% { background-position: 20% 20%; }
      }
      
      @keyframes pulseOverlay {
        0% { opacity: 0.3; transform: scale(1) rotate(0deg); }
        33% { opacity: 0.4; transform: scale(1.01) rotate(0.5deg); }
        66% { opacity: 0.35; transform: scale(1.015) rotate(-0.25deg); }
        100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-150%) translateY(-150%) rotate(30deg); }
        100% { transform: translateX(250%) translateY(250%) rotate(30deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // Fluent 2 Design Tokens
  const tokens = {
    // Spacing (4px base system)
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
      xxxxl: '40px'
    },
    // Corner radius
    borderRadius: {
      sm: '2px',
      md: '4px',
      lg: '8px',
      xl: '12px'
    },
    // Typography
    typography: {
      font: '"Poppins", "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      sizes: {
        caption: '12px',
        body: '14px',
        bodyStrong: '14px',
        subtitle2: '16px',
        subtitle1: '18px',
        title3: '20px',
        title2: '24px',
        title1: '28px',
        largeTitle: '32px'
      },
      weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    },
    // Neutral colors (adaptive) - Fluent 2 Acrylic light mode
    colors: {
      neutral: {
        // Acrylic backgrounds with transparency
        background: 'rgba(255, 255, 255, 0.85)',
        backgroundSecondary: 'rgba(255, 255, 255, 0.70)',
        backgroundTertiary: 'rgba(255, 255, 255, 0.60)',
        surface: 'rgba(255, 255, 255, 0.80)',
        surfaceSecondary: 'rgba(255, 255, 255, 0.65)',
        surfaceTertiary: 'rgba(255, 255, 255, 0.50)',
        // Acrylic overlay for cards and panels
        cardSurface: 'rgba(255, 255, 255, 0.75)',
        // Strokes for definition on transparent surfaces
        stroke: 'rgba(0, 0, 0, 0.08)',
        strokeAccessible: 'rgba(0, 0, 0, 0.16)',
        strokeSecondary: 'rgba(0, 0, 0, 0.05)',
        // Foreground colors
        foreground: 'rgba(36, 36, 36, 1)',
        foregroundSecondary: 'rgba(97, 97, 97, 1)',
        foregroundTertiary: 'rgba(117, 117, 117, 1)'
      },
      brand: {
        primary: '#0F6CBD',
        secondary: '#115EA3',
        tertiary: '#0F548C',
        background: 'rgba(15, 108, 189, 0.10)',
        foreground: '#0F6CBD'
      },
      semantic: {
        success: '#0F7B0F',
        warning: '#F7630C',
        danger: '#C50E20',
        info: '#0F6CBD',
        successBackground: 'rgba(15, 123, 15, 0.10)',
        warningBackground: 'rgba(247, 99, 12, 0.10)',
        dangerBackground: 'rgba(197, 14, 32, 0.10)',
        infoBackground: 'rgba(15, 108, 189, 0.10)'
      }
    }
  };

  // Mock data with enhanced structure
  const summaryData = {
    totalClusters: 4,
    totalHosts: 32,
    totalVMs: 847,
    totalvCPU: 3384,
    totalMemory: '12.8 TB',
    totalStorage: '245 TB'
  };

  const clusterData = [
    { 
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234, 
      vcpuRatio: '3.2:1', 
      memoryOvercommit: '1.8:1', 
      status: 'healthy',
      utilization: 78
    },
    { 
      name: 'Production Cluster 2', 
      hosts: 6, 
      vms: 189, 
      vcpuRatio: '2.9:1', 
      memoryOvercommit: '1.6:1', 
      status: 'healthy',
      utilization: 65
    },
    { 
      name: 'Dev/Test Cluster', 
      hosts: 4, 
      vms: 156, 
      vcpuRatio: '4.1:1', 
      memoryOvercommit: '2.2:1', 
      status: 'warning',
      utilization: 92
    },
    { 
      name: 'DR Cluster', 
      hosts: 8, 
      vms: 268, 
      vcpuRatio: '3.5:1', 
      memoryOvercommit: '1.9:1', 
      status: 'healthy',
      utilization: 45
    }
  ];

  const recommendations = [
    { 
      type: 'warning', 
      title: 'Zombie VMs detected', 
      description: '23 VMs powered off for >90 days consuming storage', 
      action: 'Review & Remove',
      icon: AlertTriangle
    },
    { 
      type: 'info', 
      title: 'VMware Tools outdated', 
      description: '67 VMs need tools update for security compliance', 
      action: 'Schedule Update',
      icon: Info
    },
    { 
      type: 'warning', 
      title: 'High memory overcommit', 
      description: 'Dev/Test cluster at 2.2:1 ratio risking performance', 
      action: 'Add Memory',
      icon: Zap
    },
    { 
      type: 'success', 
      title: 'HA configuration optimal', 
      description: 'All clusters properly configured for high availability', 
      action: 'No action needed',
      icon: CheckCircle
    }
  ];

  // Fluent 2 Navigation component
  const NavigationSidebar = () => (
    <div 
      style={{
        width: navCollapsed ? '64px' : '288px',
        transition: 'all 300ms ease-out',
        position: 'relative',
        background: `linear-gradient(180deg, ${tokens.colors.neutral.background} 0%, ${tokens.colors.neutral.backgroundSecondary} 100%)`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: `1px solid ${tokens.colors.neutral.stroke}`,
        fontFamily: tokens.typography.font,
        boxShadow: 'inset 1px 0 0 0 rgba(255, 255, 255, 0.2)'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          padding: '0 20px',
          borderBottom: `1px solid ${tokens.colors.neutral.strokeSecondary}`,
          background: `linear-gradient(90deg, ${tokens.colors.neutral.backgroundTertiary} 0%, ${tokens.colors.neutral.backgroundSecondary} 100%)`
        }}
      >
        {!navCollapsed && (
          <h1 
            style={{ 
              fontSize: tokens.typography.sizes.title3,
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.neutral.foreground,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            InfraPlanner
          </h1>
        )}
        <button
          onClick={() => setNavCollapsed(!navCollapsed)}
          style={{ 
            padding: '8px',
            borderRadius: tokens.borderRadius.md,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${tokens.colors.neutral.strokeSecondary}`,
            cursor: 'pointer',
            transition: 'all 200ms'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Menu size={20} color={tokens.colors.neutral.foregroundSecondary} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ padding: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'lifecycle', label: 'VMware Lifecycle Planner', icon: RefreshCw },
            { id: 'migration', label: 'Migration Planner', icon: ArrowRight },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                padding: '0 12px',
                fontSize: '14px',
                fontWeight: activeView === item.id ? tokens.typography.weights.medium : tokens.typography.weights.regular,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: activeView === item.id ? 'rgba(15, 108, 189, 0.15)' : 'transparent',
                backdropFilter: activeView === item.id ? 'blur(20px)' : 'none',
                color: activeView === item.id ? tokens.colors.brand.foreground : tokens.colors.neutral.foreground,
                border: activeView === item.id ? `1px solid rgba(15, 108, 189, 0.3)` : '1px solid transparent',
                boxShadow: activeView === item.id ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2)' : 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                background: 'none'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backdropFilter = 'blur(10px)';
                  e.currentTarget.style.border = `1px solid ${tokens.colors.neutral.strokeSecondary}`;
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.backdropFilter = 'none';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <item.icon 
                style={{ 
                  marginLeft: navCollapsed ? 'auto' : 0,
                  marginRight: navCollapsed ? 'auto' : '12px',
                  flexShrink: 0
                }} 
                size={20} 
              />
              {!navCollapsed && (
                <span style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  // Fluent 2 File Upload Component
  const FileUploadComponent = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px'
    }}>
      <div 
        style={{
          textAlign: 'center',
          padding: '48px',
          borderRadius: tokens.borderRadius.xl,
          border: '2px dashed',
          borderColor: tokens.colors.neutral.strokeAccessible,
          backgroundColor: tokens.colors.neutral.cardSurface,
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          fontFamily: tokens.typography.font,
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          transition: 'all 300ms'
        }}
        onClick={() => setIsDataUploaded(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderStyle = 'solid';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderStyle = 'dashed';
        }}
      >
        <div 
          style={{ 
            margin: '0 auto',
            width: '64px',
            height: '64px',
            borderRadius: tokens.borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            transition: 'transform 300ms',
            background: 'linear-gradient(135deg, rgba(15, 108, 189, 0.1) 0%, rgba(15, 108, 189, 0.2) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(15, 108, 189, 0.2)`
          }}
        >
          <Upload size={32} color={tokens.colors.brand.primary} />
        </div>
        <h3 
          style={{ 
            fontSize: tokens.typography.sizes.title3,
            color: tokens.colors.neutral.foreground,
            fontWeight: tokens.typography.weights.semibold,
            marginBottom: '8px'
          }}
        >
          Upload RVTools Export
        </h3>
        <p 
          style={{ 
            fontSize: tokens.typography.sizes.body,
            color: tokens.colors.neutral.foregroundSecondary,
            marginBottom: '24px',
            maxWidth: '384px',
            margin: '0 auto 24px'
          }}
        >
          Drag and drop your RVTools .xlsx or .csv file here, or click to browse
        </p>
        <button 
          style={{
            backgroundColor: tokens.colors.brand.primary,
            color: 'white',
            borderRadius: tokens.borderRadius.lg,
            fontSize: tokens.typography.sizes.body,
            fontWeight: tokens.typography.weights.medium,
            padding: '12px 24px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 200ms'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Select File
        </button>
        <p 
          style={{ 
            fontSize: tokens.typography.sizes.caption,
            color: tokens.colors.neutral.foregroundTertiary,
            marginTop: '16px'
          }}
        >
          Supports .xlsx and .csv files up to 50MB
        </p>
      </div>
    </div>
  );

  // Fluent 2 Summary Bar Component
  const SummaryBar = () => (
    <div 
      className="p-6 rounded-xl border shadow-sm mb-6"
      style={{
        backgroundColor: tokens.colors.neutral.cardSurface,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderColor: tokens.colors.neutral.stroke,
        borderRadius: tokens.borderRadius.xl,
        fontFamily: tokens.typography.font,
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="grid grid-cols-6 gap-6">
        {[
          { label: 'Clusters', value: summaryData.totalClusters, icon: Server, color: tokens.colors.brand.primary },
          { label: 'Hosts', value: summaryData.totalHosts, icon: HardDrive, color: tokens.colors.semantic.info },
          { label: 'VMs', value: summaryData.totalVMs, icon: Activity, color: tokens.colors.semantic.success },
          { label: 'vCPUs', value: summaryData.totalvCPU, icon: Cpu, color: tokens.colors.semantic.warning },
          { label: 'Memory', value: summaryData.totalMemory, icon: MemoryStick, color: tokens.colors.brand.primary },
          { label: 'Storage', value: summaryData.totalStorage, icon: HardDrive, color: tokens.colors.semantic.info }
        ].map((item, index) => (
          <div key={index} className="text-center">
            <div 
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
              style={{ 
                borderRadius: tokens.borderRadius.lg,
                background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${item.color}30`
              }}
            >
              <item.icon size={20} color={item.color} />
            </div>
            <div 
              className="font-bold"
              style={{ 
                fontSize: tokens.typography.sizes.title2,
                color: tokens.colors.neutral.foreground,
                fontWeight: tokens.typography.weights.bold
              }}
            >
              {item.value}
            </div>
            <div 
              style={{ 
                fontSize: tokens.typography.sizes.body,
                color: tokens.colors.neutral.foregroundSecondary
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Fluent 2 Cluster Card Component
  const ClusterCard = ({ cluster }) => (
    <div 
      className="p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group"
      style={{
        backgroundColor: tokens.colors.neutral.cardSurface,
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        borderColor: tokens.colors.neutral.stroke,
        borderRadius: tokens.borderRadius.xl,
        fontFamily: tokens.typography.font,
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        e.currentTarget.style.borderColor = tokens.colors.neutral.strokeAccessible;
        e.currentTarget.style.boxShadow = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.3), 0 16px 48px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = tokens.colors.neutral.cardSurface;
        e.currentTarget.style.borderColor = tokens.colors.neutral.stroke;
        e.currentTarget.style.boxShadow = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 
          className="font-semibold group-hover:text-blue-600 transition-colors duration-200"
          style={{ 
            fontSize: tokens.typography.sizes.subtitle1,
            color: tokens.colors.neutral.foreground,
            fontWeight: tokens.typography.weights.semibold
          }}
        >
          {cluster.name}
        </h3>
        <div 
          className={`w-3 h-3 rounded-full ${
            cluster.status === 'healthy' ? 'bg-green-400' : 
            cluster.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
          }`} 
        />
      </div>
      
      {/* Utilization bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span 
            style={{ 
              fontSize: tokens.typography.sizes.caption,
              color: tokens.colors.neutral.foregroundSecondary
            }}
          >
            Utilization
          </span>
          <span 
            className="font-medium"
            style={{ 
              fontSize: tokens.typography.sizes.caption,
              color: tokens.colors.neutral.foreground,
              fontWeight: tokens.typography.weights.medium
            }}
          >
            {cluster.utilization}%
          </span>
        </div>
        <div 
          className="w-full h-1.5 rounded-full"
          style={{ 
            background: 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(5px)',
            borderRadius: tokens.borderRadius.sm
          }}
        >
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              cluster.utilization > 85 ? 'bg-red-400' :
              cluster.utilization > 70 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ 
              width: `${cluster.utilization}%`,
              borderRadius: tokens.borderRadius.sm
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Hosts', value: cluster.hosts },
          { label: 'VMs', value: cluster.vms },
          { label: 'vCPU Ratio', value: cluster.vcpuRatio },
          { label: 'Memory Ratio', value: cluster.memoryOvercommit }
        ].map((item, index) => (
          <div key={index}>
            <div 
              style={{ 
                fontSize: tokens.typography.sizes.caption,
                color: tokens.colors.neutral.foregroundSecondary
              }}
            >
              {item.label}
            </div>
            <div 
              className="font-medium"
              style={{ 
                fontSize: tokens.typography.sizes.body,
                color: tokens.colors.neutral.foreground,
                fontWeight: tokens.typography.weights.medium
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Fluent 2 Tab Navigation
  const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
    <div className="border-b" style={{ borderColor: tokens.colors.neutral.stroke }}>
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              color: activeTab === tab.id ? tokens.colors.brand.primary : tokens.colors.neutral.foregroundSecondary,
              fontWeight: activeTab === tab.id ? tokens.typography.weights.medium : tokens.typography.weights.regular,
              fontFamily: tokens.typography.font
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  // Dashboard View with Fluent 2 design
  const DashboardView = () => (
    <div className="p-6" style={{ fontFamily: tokens.typography.font }}>
      {!isDataUploaded ? (
        <FileUploadComponent />
      ) : (
        <>
          <SummaryBar />
          <div 
            className="rounded-xl border shadow-sm"
            style={{
              backgroundColor: tokens.colors.neutral.cardSurface,
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderColor: tokens.colors.neutral.stroke,
              borderRadius: tokens.borderRadius.xl,
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <TabNavigation
              tabs={[
                { id: 'clusters', label: 'Clusters' },
                { id: 'resources', label: 'Resource Overview' },
                { id: 'vms', label: 'VM Inventory' },
                { id: 'hosts', label: 'Host Inventory' },
                { id: 'health', label: 'Health & Optimization' }
              ]}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <div className="p-6">
              {activeTab === 'clusters' && (
                <div className="grid grid-cols-2 gap-6">
                  {clusterData.map((cluster, index) => (
                    <ClusterCard key={index} cluster={cluster} />
                  ))}
                </div>
              )}
              {activeTab === 'health' && (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      className="flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: tokens.colors.neutral.backgroundTertiary,
                        backdropFilter: 'blur(20px) saturate(120%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                        borderColor: tokens.colors.neutral.strokeSecondary,
                        borderRadius: tokens.borderRadius.lg,
                        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div 
                        className={`mr-4 p-2 rounded-lg`}
                        style={{ 
                          borderRadius: tokens.borderRadius.md,
                          background: rec.type === 'warning' ? 'rgba(247, 99, 12, 0.15)' :
                                     rec.type === 'success' ? 'rgba(15, 123, 15, 0.15)' : 'rgba(15, 108, 189, 0.15)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${
                            rec.type === 'warning' ? 'rgba(247, 99, 12, 0.2)' :
                            rec.type === 'success' ? 'rgba(15, 123, 15, 0.2)' : 'rgba(15, 108, 189, 0.2)'
                          }`
                        }}
                      >
                        <rec.icon 
                          size={20} 
                          color={
                            rec.type === 'warning' ? tokens.colors.semantic.warning :
                            rec.type === 'success' ? tokens.colors.semantic.success : 
                            tokens.colors.semantic.info
                          } 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 
                          className="font-medium"
                          style={{ 
                            fontSize: tokens.typography.sizes.body,
                            color: tokens.colors.neutral.foreground,
                            fontWeight: tokens.typography.weights.medium
                          }}
                        >
                          {rec.title}
                        </h4>
                        <p 
                          style={{ 
                            fontSize: tokens.typography.sizes.body,
                            color: tokens.colors.neutral.foregroundSecondary
                          }}
                        >
                          {rec.description}
                        </p>
                      </div>
                      <button 
                        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm"
                        style={{
                          fontSize: tokens.typography.sizes.body,
                          fontWeight: tokens.typography.weights.medium,
                          color: tokens.colors.brand.primary,
                          background: 'rgba(15, 108, 189, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid rgba(15, 108, 189, 0.2)`,
                          borderRadius: tokens.borderRadius.lg
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 108, 189, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 108, 189, 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {rec.action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Main layout with animated gradient background
  return (
    <div 
      style={{
        height: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: tokens.typography.font
      }}
    >
      {/* Animated gradient background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -10,
          background: `
            linear-gradient(135deg, 
              #f4ebf0 0%, 
              #f0eaf4 16.66%, 
              #eeeff8 33.33%, 
              #e8f2f8 50%, 
              #eaf6f4 66.66%, 
              #f0f8fa 83.33%, 
              #f4ebf0 100%
            )`,
          backgroundSize: '600% 600%',
          animation: 'gradientFlow 24s ease-in-out infinite'
        }}
      />
      
      {/* Dynamic overlay with moving radial gradients */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -10,
          background: `
            radial-gradient(circle at 20% 80%, rgba(244, 235, 240, 0.2) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(238, 239, 248, 0.2) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(240, 248, 250, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 60% 60%, rgba(240, 234, 244, 0.15) 0%, transparent 60%)
          `,
          animation: 'pulseOverlay 36s ease-in-out infinite'
        }}
      />

      {/* Shimmer effect overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -10,
          overflow: 'hidden',
          background: `
            linear-gradient(45deg, 
              transparent 40%, 
              rgba(255, 255, 255, 0.04) 50%, 
              transparent 60%
            )`,
          backgroundSize: '300% 300%',
          animation: 'shimmer 16s ease-in-out infinite'
        }}
      />

      <NavigationSidebar />
      <main style={{ 
        flex: 1, 
        overflow: 'auto', 
        position: 'relative', 
        zIndex: 10 
      }}>
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'lifecycle' && <LifecyclePlannerView />}
        {activeView === 'migration' && <MigrationPlannerView />}
        {activeView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default InfraPlanner;