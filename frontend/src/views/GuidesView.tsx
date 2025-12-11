import React, { useState } from 'react';
import {
  Title2,
  Title3,
  Body1,
  Body2,
  Button,
  Badge,
  SearchBox,
  makeStyles
} from '@fluentui/react-components';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import { PurpleGlassDropdown } from '../components/ui';
import type { DropdownOption } from '../components/ui';
import {
  BookRegular,
  VideoRegular,
  DocumentRegular,
  ChevronRightRegular,
  SearchRegular,
  FilterRegular,
  BookOpenRegular,
  PlayCircleRegular,
  DocumentTextRegular,
  ClockRegular,
  NavigationRegular,
  DismissRegular,
  CheckmarkCircleRegular,
  InfoRegular,
  LightbulbRegular,
  WarningRegular,
  ArrowLeftRegular
} from '@fluentui/react-icons';
import { DesignTokens } from '../styles/designSystem';
import { tokens } from '@/styles/design-tokens';

interface GuideSection {
  title: string;
  content: string;
  type?: 'info' | 'tip' | 'warning' | 'steps';
  steps?: string[];
}

interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'migration' | 'lifecycle' | 'general';
  type: 'documentation' | 'video' | 'tutorial';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sections?: GuideSection[];
}

const useStyles = makeStyles({
  guidesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl
  },
  statisticsCard: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl,
    background: 'var(--card-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--card-border)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.lg,
    flexWrap: 'wrap'
  },
  searchContainer: {
    flex: 1,
    minWidth: '280px',
    maxWidth: '400px'
  }
});

const GuidesView: React.FC = () => {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  // Dropdown options for filters
  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'migration', label: 'Migration' },
    { value: 'lifecycle', label: 'Lifecycle' }
  ];

  const difficultyOptions: DropdownOption[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const guides: Guide[] = [
    // Getting Started
    {
      id: 'getting-started',
      title: 'Getting Started with Archer',
      description: 'Learn the basics of project creation, navigation, and understanding the Archer interface',
      category: 'general',
      type: 'documentation',
      duration: '10 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'Welcome to Archer',
          content: 'Archer is a comprehensive lifecycle management platform designed to help you plan, execute, and track infrastructure migrations and hardware lifecycle projects. This guide will walk you through the core concepts and help you get productive quickly.'
        },
        {
          title: 'Understanding the Interface',
          content: 'The main interface consists of several key areas: the Navigation Sidebar on the left provides access to all major features, the main content area displays your current view, and the header provides quick access to settings and notifications.',
          type: 'info'
        },
        {
          title: 'Key Navigation Areas',
          type: 'steps',
          content: 'Navigate through these main sections:',
          steps: [
            'Dashboard - Overview of all projects, activities, and key metrics',
            'Projects - Create and manage migration and lifecycle projects',
            'Service Desk - Track incidents, problems, and service requests',
            'Monitoring - Real-time infrastructure monitoring and topology visualization',
            'Hardware Pool - Manage available hardware inventory and allocations',
            'Guides - Documentation and tutorials (you are here!)'
          ]
        },
        {
          title: 'Quick Start Tip',
          type: 'tip',
          content: 'Start by creating your first project from the Dashboard. The Activity Wizard will guide you through setting up activities, timelines, and resource allocations step by step.'
        }
      ]
    },
    {
      id: 'project-creation',
      title: 'Creating Your First Project',
      description: 'Step-by-step guide to creating a migration or lifecycle project with activities and timelines',
      category: 'general',
      type: 'tutorial',
      duration: '15 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'Project Types',
          content: 'Archer supports two main project types: Migration Projects for moving workloads between environments, and Lifecycle Projects for managing hardware refresh cycles and decommissioning.'
        },
        {
          title: 'Creating a New Project',
          type: 'steps',
          content: 'Follow these steps to create your first project:',
          steps: [
            'Navigate to the Projects view from the sidebar',
            'Click the "New Project" button in the top-right corner',
            'Select your project type (Migration or Lifecycle)',
            'Fill in project details: name, description, and target dates',
            'Define the scope by adding source and destination environments',
            'Review and confirm to create your project'
          ]
        },
        {
          title: 'Adding Activities',
          content: 'Projects are organized into Activities - discrete work items with their own timelines, owners, and dependencies. Use the Activity Wizard to add structured activities with proper sequencing.',
          type: 'info'
        },
        {
          title: 'Best Practice',
          type: 'tip',
          content: 'Break large migrations into smaller, manageable activities. This makes tracking progress easier and reduces risk by allowing for incremental validation.'
        }
      ]
    },
    
    // Migration Guides
    {
      id: 'migration-planning',
      title: 'Migration Planning Best Practices',
      description: 'Complete guide to planning and executing infrastructure migrations using the Activity Wizard',
      category: 'migration',
      type: 'tutorial',
      duration: '30 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Migration Planning Overview',
          content: 'Successful migrations require careful planning across discovery, assessment, design, execution, and validation phases. Archer provides tools for each phase to ensure nothing falls through the cracks.'
        },
        {
          title: 'Discovery Phase',
          type: 'steps',
          content: 'Start by understanding what you have:',
          steps: [
            'Import RVTools export to capture your VM inventory',
            'Review cluster configurations and resource utilization',
            'Identify dependencies between workloads',
            'Document network configurations and security groups',
            'Catalog storage requirements and performance tiers'
          ]
        },
        {
          title: 'Assessment & Design',
          content: 'Use the Capacity Visualizer to model your destination environment. Configure cluster strategies, define overcommit ratios, and validate that your target infrastructure can handle the migrated workloads.',
          type: 'info'
        },
        {
          title: 'Activity Wizard',
          content: 'The Activity Wizard helps you create structured migration activities with proper sequencing. It supports wave-based migrations, allowing you to group VMs by application, business unit, or risk level.'
        },
        {
          title: 'Important Consideration',
          type: 'warning',
          content: 'Always plan for rollback scenarios. Document the steps required to revert each migration wave and ensure you have sufficient time windows allocated for potential issues.'
        }
      ]
    },
    {
      id: 'rvtools-import',
      title: 'RVTools Data Import & Analysis',
      description: 'Import VMware environment data from RVTools exports and analyze VM inventory, clusters, and storage',
      category: 'migration',
      type: 'tutorial',
      duration: '15 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'What is RVTools?',
          content: 'RVTools is a free utility that exports detailed information from VMware vCenter environments. Archer can import this data to provide a comprehensive view of your source infrastructure.'
        },
        {
          title: 'Preparing Your Export',
          type: 'steps',
          content: 'Generate a complete RVTools export:',
          steps: [
            'Download and run RVTools on a machine with vCenter access',
            'Connect to your vCenter server with appropriate credentials',
            'Wait for RVTools to collect all inventory data',
            'Export to Excel format (.xlsx)',
            'Include all tabs - vInfo, vCPU, vMemory, vDisk, vNetwork, and vHost are essential'
          ]
        },
        {
          title: 'Importing into Archer',
          type: 'steps',
          content: 'Upload and process your RVTools data:',
          steps: [
            'Navigate to your project and select "Import Data"',
            'Choose "RVTools Export" as the source type',
            'Upload your .xlsx file',
            'Review the import summary - VM count, clusters detected, etc.',
            'Confirm the import to populate your project with VM inventory'
          ]
        },
        {
          title: 'Data Validation Tip',
          type: 'tip',
          content: 'After import, review the VM inventory in the project details. Check for VMs with unusually high resource allocations or those marked as powered off - these may need special handling during migration.'
        }
      ]
    },
    {
      id: 'capacity-planning',
      title: 'Capacity Planning with Visualizer',
      description: 'Using the interactive capacity visualizer for destination cluster sizing and VM placement',
      category: 'migration',
      type: 'tutorial',
      duration: '25 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Capacity Visualizer Overview',
          content: 'The Capacity Visualizer provides an interactive view of your destination infrastructure capacity. It helps you understand resource utilization, identify bottlenecks, and optimize VM placement before migration begins.'
        },
        {
          title: 'Key Capacity Metrics',
          type: 'info',
          content: 'Monitor these critical metrics: CPU cores and utilization percentages, memory allocation and reservation levels, storage capacity and IOPS capabilities, and network bandwidth availability.'
        },
        {
          title: 'Using the Visualizer',
          type: 'steps',
          content: 'Navigate and analyze your capacity:',
          steps: [
            'Open the project and navigate to Capacity Planning',
            'Select your destination cluster from the dropdown',
            'Review the visual breakdown of allocated vs. available resources',
            'Use filters to view capacity by VM group or application',
            'Adjust overcommit ratios to see impact on available capacity',
            'Export capacity reports for stakeholder review'
          ]
        },
        {
          title: 'Overcommit Guidance',
          type: 'warning',
          content: 'While CPU overcommit ratios of 4:1 to 8:1 are common in virtual environments, memory overcommit should be used sparingly. Monitor actual utilization patterns before relying on aggressive overcommit.'
        }
      ]
    },
    {
      id: 'cluster-strategy',
      title: 'Cluster Strategy Configuration',
      description: 'Configure destination clusters, overcommit ratios, HA policies, and VM distribution strategies',
      category: 'migration',
      type: 'documentation',
      duration: '20 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Understanding Cluster Strategies',
          content: 'Cluster strategies define how VMs are distributed across hosts and how resources are reserved for high availability. Proper configuration ensures optimal performance and resilience.'
        },
        {
          title: 'Configuring HA Policy',
          type: 'steps',
          content: 'Set up High Availability for your destination cluster:',
          steps: [
            'Navigate to Cluster Strategy in your project settings',
            'Select the target cluster to configure',
            'Enable HA and choose admission control policy',
            'Set host failure tolerance (typically 1 or 2 hosts)',
            'Configure percentage of resources reserved for failover',
            'Save and validate the configuration'
          ]
        },
        {
          title: 'VM Distribution Strategies',
          content: 'Choose from several distribution approaches: Balanced distribution spreads VMs evenly across hosts, Workload-aware groups related VMs together, and Affinity rules ensure specific VMs stay together or apart.',
          type: 'info'
        },
        {
          title: 'Pro Tip',
          type: 'tip',
          content: 'For production workloads, always configure anti-affinity rules for redundant components (like clustered databases) to ensure they run on different hosts.'
        }
      ]
    },
    {
      id: 'vm-placement-optimization',
      title: 'VM Placement Optimization',
      description: 'Advanced techniques for optimizing VM placement across hosts using affinity rules and constraints',
      category: 'migration',
      type: 'documentation',
      duration: '35 min',
      difficulty: 'advanced',
      sections: [
        {
          title: 'Advanced Placement Concepts',
          content: 'Beyond basic distribution, advanced VM placement considers application topology, compliance requirements, licensing constraints, and performance optimization. This guide covers techniques used by experienced migration architects.'
        },
        {
          title: 'Affinity and Anti-Affinity Rules',
          type: 'info',
          content: 'Affinity rules keep VMs together on the same host (useful for latency-sensitive apps), while anti-affinity rules ensure VMs run on different hosts (critical for HA configurations).'
        },
        {
          title: 'Creating Placement Rules',
          type: 'steps',
          content: 'Define placement constraints:',
          steps: [
            'Identify VM groups that require affinity or anti-affinity',
            'Navigate to VM Placement Rules in project settings',
            'Create a new rule and select rule type (affinity/anti-affinity)',
            'Add VMs to the rule group',
            'Set enforcement level (required vs. preferred)',
            'Validate rule conflicts before saving'
          ]
        },
        {
          title: 'Licensing Considerations',
          type: 'warning',
          content: 'Some software licenses require VMs to run on specific hosts or a limited number of sockets. Use host affinity rules combined with host groups to ensure compliance and avoid audit issues.'
        },
        {
          title: 'Performance Optimization',
          content: 'For performance-sensitive workloads, consider NUMA topology alignment, GPU/vGPU resource requirements, storage latency based on datastore location, and network bandwidth between VMs that communicate frequently.'
        }
      ]
    },
    
    // Lifecycle Guides
    {
      id: 'hardware-lifecycle',
      title: 'Hardware Lifecycle Management',
      description: 'Managing hardware refresh cycles, tracking end-of-life dates, and planning replacements',
      category: 'lifecycle',
      type: 'documentation',
      duration: '20 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Lifecycle Management Overview',
          content: 'Hardware lifecycle management ensures your infrastructure remains supportable, secure, and cost-effective. Archer tracks warranty expirations, end-of-support dates, and helps plan timely hardware refreshes.'
        },
        {
          title: 'Key Lifecycle Stages',
          type: 'info',
          content: 'Hardware moves through several stages: Procurement, Deployment, Production, End-of-Warranty, End-of-Support, and Decommission. Each stage has different operational considerations and cost implications.'
        },
        {
          title: 'Setting Up Lifecycle Tracking',
          type: 'steps',
          content: 'Configure lifecycle tracking for your hardware:',
          steps: [
            'Add hardware to the Asset database with purchase dates',
            'Set warranty expiration dates for each asset',
            'Define end-of-support dates based on vendor announcements',
            'Configure alert thresholds (e.g., 90 days before expiry)',
            'Assign owners responsible for refresh planning'
          ]
        },
        {
          title: 'Refresh Planning',
          content: 'Use lifecycle projects to plan hardware refreshes. Group assets by refresh window, estimate budget requirements, and coordinate with procurement and deployment teams for smooth transitions.'
        },
        {
          title: 'Cost Optimization Tip',
          type: 'tip',
          content: 'Consider extended warranty options for critical infrastructure that cannot be easily replaced. The cost of extended support is often less than emergency procurement or unplanned downtime.'
        }
      ]
    },
    {
      id: 'hardware-pool',
      title: 'Hardware Pool Management',
      description: 'Track available hardware inventory, allocate servers to projects, and manage the free pool',
      category: 'lifecycle',
      type: 'tutorial',
      duration: '15 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'What is the Hardware Pool?',
          content: 'The Hardware Pool is a central inventory of available hardware resources that can be allocated to projects. It provides visibility into what hardware is available for deployment and helps optimize asset utilization.'
        },
        {
          title: 'Pool Categories',
          type: 'info',
          content: 'Hardware in the pool is categorized as: Available (ready for allocation), Reserved (held for upcoming projects), In-Use (currently deployed), and Decommissioned (pending disposal or recycling).'
        },
        {
          title: 'Adding Hardware to Pool',
          type: 'steps',
          content: 'Register new hardware in the pool:',
          steps: [
            'Navigate to Hardware Pool from the sidebar',
            'Click "Add Hardware" to register new assets',
            'Enter hardware details: model, serial number, specifications',
            'Set initial status (typically "Available")',
            'Assign location and rack information if applicable',
            'Save to add the hardware to inventory'
          ]
        },
        {
          title: 'Allocating Hardware',
          type: 'steps',
          content: 'Assign hardware to projects:',
          steps: [
            'Select hardware items to allocate',
            'Click "Allocate to Project"',
            'Choose the destination project',
            'Specify the allocation purpose',
            'Confirm the allocation'
          ]
        }
      ]
    },
    {
      id: 'decommissioning',
      title: 'Server Decommissioning Workflow',
      description: 'Best practices for safely decommissioning servers and returning them to the hardware pool',
      category: 'lifecycle',
      type: 'documentation',
      duration: '25 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Decommissioning Overview',
          content: 'Server decommissioning is a structured process to safely remove hardware from production. It involves workload migration, data sanitization, documentation updates, and physical asset handling.'
        },
        {
          title: 'Pre-Decommission Checklist',
          type: 'steps',
          content: 'Complete these steps before decommissioning:',
          steps: [
            'Confirm all workloads have been migrated or terminated',
            'Verify backup retention requirements are met',
            'Remove DNS records and DHCP reservations',
            'Update monitoring to prevent false alerts',
            'Document any dependencies that need updating',
            'Obtain formal approval from system owners'
          ]
        },
        {
          title: 'Data Sanitization',
          type: 'warning',
          content: 'All storage must be securely wiped before hardware disposal. Follow your organization\'s data classification and sanitization policies. For regulated industries, maintain certificates of destruction.'
        },
        {
          title: 'Asset Disposition',
          content: 'After sanitization, hardware can be: Returned to the pool for redeployment, Sent for warranty return/trade-in, Recycled through certified e-waste vendors, or Donated (with proper data wipe verification).',
          type: 'info'
        }
      ]
    },
    
    // Infrastructure Monitoring
    {
      id: 'monitoring-overview',
      title: 'Infrastructure Monitoring Dashboard',
      description: 'Understanding the monitoring dashboard, alerts, metrics, and topology visualization',
      category: 'general',
      type: 'documentation',
      duration: '15 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'Monitoring Dashboard Overview',
          content: 'The Monitoring view provides real-time visibility into your infrastructure health. It combines metrics, alerts, and topology visualization to give you a complete picture of your environment.'
        },
        {
          title: 'Dashboard Components',
          type: 'info',
          content: 'The dashboard includes: Health status indicators showing overall system health, Active alerts panel highlighting issues requiring attention, Performance metrics for key infrastructure components, and Quick action buttons for common operations.'
        },
        {
          title: 'Understanding Alerts',
          type: 'steps',
          content: 'Navigate and manage alerts:',
          steps: [
            'View active alerts in the Alerts panel',
            'Click an alert to see detailed information',
            'Acknowledge alerts to indicate awareness',
            'Assign alerts to team members for resolution',
            'Add notes documenting investigation progress',
            'Resolve alerts when issues are fixed'
          ]
        },
        {
          title: 'Topology View',
          content: 'Switch to the Infrastructure Topology tab to see an interactive graph view of your infrastructure. Click on nodes to view details, and explore relationships between components.',
          type: 'tip'
        }
      ]
    },
    {
      id: 'topology-visualization',
      title: 'Infrastructure Topology Visualization',
      description: 'Navigate and explore your infrastructure topology with the interactive graph view',
      category: 'general',
      type: 'tutorial',
      duration: '10 min',
      difficulty: 'beginner',
      sections: [
        {
          title: 'Topology View Features',
          content: 'The Infrastructure Topology tab provides an interactive graph visualization of your infrastructure. It shows relationships between datacenters, clusters, hosts, VMs, and other components.'
        },
        {
          title: 'Navigation Controls',
          type: 'steps',
          content: 'Interact with the topology view:',
          steps: [
            'Pan the view by clicking and dragging the background',
            'Zoom in/out using the mouse wheel or zoom controls',
            'Click a node to select it and view details',
            'Double-click to center on a specific node',
            'Use the minimap for orientation in large topologies',
            'Use filters to show/hide different node types'
          ]
        },
        {
          title: 'Node Details Panel',
          content: 'When you select a node, the details panel shows comprehensive information including name, type, status, resource metrics, and related objects. This panel updates in real-time.',
          type: 'info'
        },
        {
          title: 'Pro Tip',
          type: 'tip',
          content: 'Use the search function to quickly locate specific VMs or hosts. The topology will automatically pan and zoom to center on the found item.'
        }
      ]
    },
    
    // Service Desk Integration
    {
      id: 'service-desk',
      title: 'Service Desk & Incident Management',
      description: 'Create tickets, manage incidents, and track SLAs using the integrated service desk',
      category: 'general',
      type: 'tutorial',
      duration: '20 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Service Desk Overview',
          content: 'The integrated Service Desk provides ITIL-aligned incident, problem, and change management. It includes SLA tracking, escalation workflows, and integration with the CMDB for configuration item linking.'
        },
        {
          title: 'Creating Tickets',
          type: 'steps',
          content: 'Create and manage tickets:',
          steps: [
            'Navigate to Service Desk from the sidebar',
            'Click "New Ticket" and select ticket type (Incident/Problem/Change)',
            'Fill in summary and detailed description',
            'Set priority and impact levels',
            'Link affected Configuration Items (CIs)',
            'Assign to appropriate team or individual',
            'Submit the ticket'
          ]
        },
        {
          title: 'SLA Tracking',
          type: 'info',
          content: 'Each ticket type has associated SLAs defining response and resolution times. The dashboard shows SLA compliance metrics, and tickets approaching breach are automatically highlighted.'
        },
        {
          title: 'Best Practice',
          type: 'tip',
          content: 'Always link tickets to affected CIs. This creates a history of issues for each asset and helps identify recurring problems that may indicate underlying infrastructure issues.'
        }
      ]
    },
    {
      id: 'asset-management',
      title: 'CMDB & Asset Tracking',
      description: 'Track infrastructure assets, link incidents to CIs, and maintain your configuration database',
      category: 'general',
      type: 'documentation',
      duration: '25 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'CMDB Fundamentals',
          content: 'The Configuration Management Database (CMDB) stores information about your IT assets (Configuration Items or CIs). It maintains relationships between CIs and provides the foundation for effective change and incident management.'
        },
        {
          title: 'Configuration Item Types',
          type: 'info',
          content: 'Common CI types include: Hardware (servers, storage, network equipment), Software (applications, databases, middleware), Services (business services, technical services), and Documentation (runbooks, architecture docs).'
        },
        {
          title: 'Adding Assets to CMDB',
          type: 'steps',
          content: 'Register configuration items:',
          steps: [
            'Navigate to CMDB/Asset Management',
            'Click "Add Configuration Item"',
            'Select CI type and class',
            'Enter asset details and attributes',
            'Define relationships with other CIs',
            'Set owner and support group',
            'Save the configuration item'
          ]
        },
        {
          title: 'CI Relationships',
          content: 'Relationships between CIs are critical for impact analysis. Common relationship types include: Depends On, Runs On, Connected To, and Part Of. Well-maintained relationships enable accurate change impact assessment.',
          type: 'warning'
        }
      ]
    },
    
    // Document Generation
    {
      id: 'document-generation',
      title: 'Document Generation & Templates',
      description: 'Generate High-Level Design (HLD), Low-Level Design (LLD), and Bill of Materials documents',
      category: 'general',
      type: 'documentation',
      duration: '20 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Document Generation Overview',
          content: 'Archer can automatically generate professional project documentation. This includes HLD/LLD documents, network diagrams, and Bills of Materials based on your project data.'
        },
        {
          title: 'Available Document Types',
          type: 'info',
          content: 'Generate these document types: High-Level Design (HLD) - architecture overview and design decisions, Low-Level Design (LLD) - detailed technical specifications, Bill of Materials (BOM) - itemized hardware and licensing requirements, Network Diagrams - visual topology representations.'
        },
        {
          title: 'Generating Documents',
          type: 'steps',
          content: 'Create project documentation:',
          steps: [
            'Navigate to your project',
            'Select "Generate Documents" from the actions menu',
            'Choose document type(s) to generate',
            'Select included sections and level of detail',
            'Choose output format (DOCX, PDF, HTML)',
            'Click Generate and download your documents'
          ]
        },
        {
          title: 'Template Customization',
          type: 'tip',
          content: 'Document templates can be customized with your organization\'s branding. Contact your administrator to set up custom headers, footers, and styling.'
        }
      ]
    },
    {
      id: 'hld-creation',
      title: 'Creating High-Level Design Documents',
      description: 'Best practices for generating professional HLD documents with network diagrams and architecture',
      category: 'migration',
      type: 'tutorial',
      duration: '30 min',
      difficulty: 'advanced',
      sections: [
        {
          title: 'HLD Document Purpose',
          content: 'The High-Level Design document provides stakeholders with a comprehensive overview of the migration approach. It covers architecture decisions, risk mitigation strategies, and high-level timelines without diving into implementation details.'
        },
        {
          title: 'Essential HLD Sections',
          type: 'info',
          content: 'A complete HLD includes: Executive Summary, Current State Architecture, Target State Architecture, Migration Approach, Risk Assessment, Timeline Overview, and Resource Requirements.'
        },
        {
          title: 'Preparing for HLD Generation',
          type: 'steps',
          content: 'Ensure quality HLD output:',
          steps: [
            'Complete source environment discovery (RVTools import)',
            'Define destination cluster configurations',
            'Document design decisions and rationale',
            'Define migration waves and dependencies',
            'Identify and document key risks',
            'Confirm project timeline and milestones'
          ]
        },
        {
          title: 'Including Diagrams',
          content: 'HLD documents automatically include architecture diagrams generated from your project topology. For best results, ensure your infrastructure visualization is accurate and up-to-date before generating.'
        },
        {
          title: 'Review Guidance',
          type: 'warning',
          content: 'Always review generated HLDs before distribution. While auto-generated content is comprehensive, project-specific context and stakeholder-relevant messaging should be reviewed and refined.'
        }
      ]
    },
    
    // Advanced Topics
    {
      id: 'api-integration',
      title: 'API Integration Guide',
      description: 'Integrate Archer with external systems using the REST API',
      category: 'general',
      type: 'documentation',
      duration: '40 min',
      difficulty: 'advanced',
      sections: [
        {
          title: 'API Overview',
          content: 'Archer provides a comprehensive REST API for integration with external systems. The API supports all core operations including project management, asset operations, ticket creation, and data import/export.'
        },
        {
          title: 'Authentication',
          type: 'info',
          content: 'The API uses token-based authentication. Generate API tokens from your user settings. Tokens can be scoped to specific operations and set with expiration dates for security.'
        },
        {
          title: 'Getting Started with API',
          type: 'steps',
          content: 'Begin API integration:',
          steps: [
            'Generate an API token from Settings > API Access',
            'Review the API documentation at /api/docs',
            'Test authentication with a simple GET request',
            'Start with read operations before attempting writes',
            'Implement error handling for rate limits and failures',
            'Use webhooks for event-driven integrations'
          ]
        },
        {
          title: 'Common Integration Patterns',
          content: 'Popular integrations include: Syncing assets from external CMDB systems, Creating tickets from monitoring alerts, Exporting project data to reporting tools, and Automating hardware pool updates from procurement systems.'
        },
        {
          title: 'Rate Limiting',
          type: 'warning',
          content: 'API requests are rate-limited to ensure system stability. Default limits are 100 requests per minute per token. For bulk operations, use batch endpoints or request limit increases.'
        }
      ]
    },
    {
      id: 'data-collection',
      title: 'Data Collection Strategies',
      description: 'Collect and import infrastructure data from various sources including vCenter and network devices',
      category: 'migration',
      type: 'documentation',
      duration: '25 min',
      difficulty: 'intermediate',
      sections: [
        {
          title: 'Data Collection Overview',
          content: 'Accurate infrastructure data is the foundation of successful migrations. Archer supports multiple data collection methods to accommodate different environments and security requirements.'
        },
        {
          title: 'Supported Data Sources',
          type: 'info',
          content: 'Import data from: RVTools exports (VMware), CSV/Excel templates for manual entry, Direct vCenter API connection (if configured), Network device exports (switch/router configs), and Storage array reports.'
        },
        {
          title: 'Data Collection Best Practices',
          type: 'steps',
          content: 'Ensure complete and accurate data:',
          steps: [
            'Schedule data collection during low-activity periods',
            'Collect from all vCenter instances in scope',
            'Include powered-off VMs (they often get forgotten)',
            'Document data collection dates for reference',
            'Validate imported data against known baselines',
            'Refresh data periodically during long projects'
          ]
        },
        {
          title: 'Data Freshness',
          type: 'tip',
          content: 'For active environments, refresh your data collection weekly during the planning phase and daily during execution. Stale data leads to capacity planning errors and missed VMs.'
        }
      ]
    }
  ];

  // Filter guides based on search and filters
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = searchTerm === '' || 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Statistics calculations
  const stats = {
    total: guides.length,
    byCategory: {
      general: guides.filter(g => g.category === 'general').length,
      migration: guides.filter(g => g.category === 'migration').length,
      lifecycle: guides.filter(g => g.category === 'lifecycle').length,
    },
    byType: {
      documentation: guides.filter(g => g.type === 'documentation').length,
      video: guides.filter(g => g.type === 'video').length,
      tutorial: guides.filter(g => g.type === 'tutorial').length,
    },
    byDifficulty: {
      beginner: guides.filter(g => g.difficulty === 'beginner').length,
      intermediate: guides.filter(g => g.difficulty === 'intermediate').length,
      advanced: guides.filter(g => g.difficulty === 'advanced').length,
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'migration': return DesignTokens.colorVariants.indigo.base;
      case 'lifecycle': return DesignTokens.colorVariants.emerald.base;
      case 'general': return DesignTokens.colorVariants.violet.base;
      default: return 'var(--text-secondary)';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return DesignTokens.colorVariants.emerald.base;
      case 'intermediate': return DesignTokens.colorVariants.amber.base;
      case 'advanced': return DesignTokens.colorVariants.red.base;
      default: return 'var(--text-secondary)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircleRegular />;
      case 'tutorial': return <BookOpenRegular />;
      case 'documentation': return <DocumentTextRegular />;
      default: return <DocumentTextRegular />;
    }
  };

  return (
    <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
        paddingBottom: DesignTokens.spacing.lg
      }}>
        <div>
          <h1 style={{
            fontSize: DesignTokens.typography.xxxl,
            fontWeight: DesignTokens.typography.semibold,
            color: 'var(--text-primary)',
            margin: '0',
            fontFamily: DesignTokens.typography.fontFamily,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <NavigationRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
            Guides & Documentation
          </h1>
          <p style={{
            fontSize: DesignTokens.typography.lg,
            color: 'var(--text-secondary)',
            fontFamily: DesignTokens.typography.fontFamily,
            margin: 0
          }}>
            Comprehensive guides and tutorials to help you get the most out of Archer
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="purple-glass-card static" style={{
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colors.primary,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Total Guides
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.emerald.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.byDifficulty.beginner}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Beginner
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.indigo.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.byType.video}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Video Guides
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.amber.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {filteredGuides.length}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Showing
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <GlassmorphicSearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search guides and documentation..."
            width="100%"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PurpleGlassDropdown
            placeholder="Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as string)}
            glass="light"
          />

          <PurpleGlassDropdown
            placeholder="Difficulty"
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={(value) => setSelectedDifficulty(value as string)}
            glass="light"
          />
        </div>
      </div>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <div className="purple-glass-card static" style={{
          padding: '32px',
          textAlign: 'center',
          margin: '32px 0'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            color: 'var(--text-muted)'
          }}>
            <BookRegular />
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px',
            fontFamily: tokens.fontFamilyBody,
            margin: '0 0 12px 0'
          }}>
            No guides found
          </h3>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            marginBottom: '32px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
            fontFamily: tokens.fontFamilyBody
          }}>
            Try adjusting your search terms or filters to find the guides you're looking for.
          </p>
          <button
            style={{
              background: 'transparent',
              color: 'var(--brand-primary)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: tokens.fontFamilyBody,
              cursor: 'pointer'
            }}
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={styles.guidesGrid}>
          {filteredGuides.map((guide) => (
            <div 
              key={guide.id} 
              className="purple-glass-card"
              style={{
                padding: '24px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedGuide(guide)}
          >
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '100%'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: `2px solid ${getCategoryColor(guide.category)}40`,
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: getCategoryColor(guide.category),
                  flexShrink: 0
                }}>
                  {getTypeIcon(guide.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    fontFamily: tokens.fontFamilyBody,
                    lineHeight: '1.4',
                    margin: '0 0 8px 0'
                  }}>
                    {guide.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    fontFamily: tokens.fontFamilyBody,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {guide.description}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: 'auto'
              }}>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  fontFamily: tokens.fontFamilyBody,
                  textTransform: 'capitalize'
                }}>
                  {guide.category}
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontFamily: tokens.fontFamilyBody,
                  textTransform: 'capitalize'
                }}>
                  {guide.difficulty}
                </span>
                {guide.duration && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-secondary)',
                    fontFamily: tokens.fontFamilyBody,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ClockRegular style={{ fontSize: '12px' }} />
                    {guide.duration}
                  </span>
                )}
              </div>
            </div>
            </div>
          ))}
        </div>
      )}

      {/* Additional Resources */}
      <div style={{
        ...DesignTokens.components.borderCard,
        padding: DesignTokens.spacing.xxl,
        marginTop: DesignTokens.spacing.xxl
      }}>
        <Title3 style={{
          fontSize: DesignTokens.typography.xxl,
          fontWeight: DesignTokens.typography.semibold,
          color: 'var(--text-primary)',
          marginBottom: DesignTokens.spacing.xl,
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: DesignTokens.spacing.md
        }}>
          <BookRegular style={{ fontSize: '24px', color: DesignTokens.colors.primary }} />
          Additional Resources
        </Title3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: DesignTokens.spacing.lg 
        }}>
          {[
            { name: 'API Documentation', icon: <DocumentTextRegular />, color: DesignTokens.colorVariants.indigo.base },
            { name: 'Video Library', icon: <PlayCircleRegular />, color: DesignTokens.colorVariants.emerald.base },
            { name: 'Community Forum', icon: <BookOpenRegular />, color: DesignTokens.colorVariants.amber.base },
            { name: 'Release Notes', icon: <DocumentRegular />, color: 'var(--text-secondary)' }
          ].map((resource, index) => (
            <Button
              key={index}
              appearance="outline"
              style={{
                ...DesignTokens.components.button.secondary,
                borderColor: `${resource.color}40`,
                color: resource.color,
                background: 'transparent',
                height: '64px',
                fontSize: DesignTokens.typography.sm,
                fontWeight: DesignTokens.typography.medium,
                fontFamily: DesignTokens.typography.fontFamily,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: DesignTokens.spacing.sm
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${resource.color}10`;
                e.currentTarget.style.borderColor = resource.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${resource.color}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = `${resource.color}40`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              icon={resource.icon}
            >
              {resource.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
          onClick={() => setSelectedGuide(null)}
        >
          <div 
            className="purple-glass-card static"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              background: 'rgba(139, 92, 246, 0.05)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                border: `2px solid ${getCategoryColor(selectedGuide.category)}40`,
                background: `${getCategoryColor(selectedGuide.category)}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: getCategoryColor(selectedGuide.category),
                flexShrink: 0
              }}>
                {getTypeIcon(selectedGuide.type)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontFamily: tokens.fontFamilyBody,
                  margin: '0 0 8px 0'
                }}>
                  {selectedGuide.title}
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  fontFamily: tokens.fontFamilyBody,
                  margin: '0 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  {selectedGuide.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: `${getCategoryColor(selectedGuide.category)}15`,
                    color: getCategoryColor(selectedGuide.category),
                    fontFamily: tokens.fontFamilyBody,
                    textTransform: 'capitalize',
                    fontWeight: '500'
                  }}>
                    {selectedGuide.category}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: `${getDifficultyColor(selectedGuide.difficulty)}15`,
                    color: getDifficultyColor(selectedGuide.difficulty),
                    fontFamily: tokens.fontFamilyBody,
                    textTransform: 'capitalize',
                    fontWeight: '500'
                  }}>
                    {selectedGuide.difficulty}
                  </span>
                  {selectedGuide.duration && (
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: 'var(--text-secondary)',
                      fontFamily: tokens.fontFamilyBody,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ClockRegular style={{ fontSize: '12px' }} />
                      {selectedGuide.duration}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <DismissRegular style={{ fontSize: '24px' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '32px'
            }}>
              {selectedGuide.sections && selectedGuide.sections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {selectedGuide.sections.map((section, index) => (
                    <div key={index} style={{
                      padding: section.type ? '20px 24px' : '0',
                      borderRadius: section.type ? '12px' : '0',
                      background: section.type === 'info' ? 'rgba(99, 102, 241, 0.08)' :
                                  section.type === 'tip' ? 'rgba(16, 185, 129, 0.08)' :
                                  section.type === 'warning' ? 'rgba(245, 158, 11, 0.08)' :
                                  section.type === 'steps' ? 'rgba(139, 92, 246, 0.05)' :
                                  'transparent',
                      border: section.type ? `1px solid ${
                        section.type === 'info' ? 'rgba(99, 102, 241, 0.2)' :
                        section.type === 'tip' ? 'rgba(16, 185, 129, 0.2)' :
                        section.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(139, 92, 246, 0.15)'
                      }` : 'none'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '12px'
                      }}>
                        {section.type === 'info' && (
                          <InfoRegular style={{ fontSize: '20px', color: '#6366f1' }} />
                        )}
                        {section.type === 'tip' && (
                          <LightbulbRegular style={{ fontSize: '20px', color: '#10b981' }} />
                        )}
                        {section.type === 'warning' && (
                          <WarningRegular style={{ fontSize: '20px', color: '#f59e0b' }} />
                        )}
                        {section.type === 'steps' && (
                          <CheckmarkCircleRegular style={{ fontSize: '20px', color: '#8b5cf6' }} />
                        )}
                        <h3 style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: section.type === 'info' ? '#6366f1' :
                                 section.type === 'tip' ? '#10b981' :
                                 section.type === 'warning' ? '#f59e0b' :
                                 section.type === 'steps' ? '#8b5cf6' :
                                 'var(--text-primary)',
                          fontFamily: tokens.fontFamilyBody,
                          margin: 0
                        }}>
                          {section.title}
                        </h3>
                      </div>
                      <p style={{
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        fontFamily: tokens.fontFamilyBody,
                        lineHeight: '1.7',
                        margin: 0
                      }}>
                        {section.content}
                      </p>
                      {section.type === 'steps' && section.steps && (
                        <ol style={{
                          margin: '16px 0 0 0',
                          paddingLeft: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          {section.steps.map((step, stepIndex) => (
                            <li key={stepIndex} style={{
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              fontFamily: tokens.fontFamilyBody,
                              lineHeight: '1.6',
                              paddingLeft: '8px'
                            }}>
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  color: 'var(--text-secondary)'
                }}>
                  <BookRegular style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{
                    fontSize: '15px',
                    fontFamily: tokens.fontFamilyBody,
                    margin: 0
                  }}>
                    Detailed content for this guide is coming soon.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 32px',
              borderTop: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(139, 92, 246, 0.03)'
            }}>
              <button
                onClick={() => setSelectedGuide(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: tokens.fontFamilyBody,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.borderColor = '#8b5cf6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }}
              >
                <ArrowLeftRegular style={{ fontSize: '16px' }} />
                Back to Guides
              </button>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontFamily: tokens.fontFamilyBody
              }}>
                {selectedGuide.sections?.length || 0} sections
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidesView;
