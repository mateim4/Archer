import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile } from '@tauri-apps/api/fs';
import {
  Button,
  useTheme,
  TabList,
  Tab,
  Card,
  Spinner,
  Title1,
  Body1,
} from '@fluentui/react-components';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { applyFluentTheme } from '../utils/fluentMermaidTheme';
import { NetworkTopology } from '../utils/types';

mermaid.initialize({ startOnLoad: true,
    theme: 'base',
    themeVariables: {
        background: '#ffffff',
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        lineColor: '#000000',
    }
});

const NetworkVisualizerView = () => {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mermaidChart, setMermaidChart] = useState('');
  const [view, setView] = useState<'virtual' | 'physical'>('virtual');
  const [platform, setPlatform] = useState<'vmware' | 'hyperv'>('vmware');
  const theme = useTheme();

  useEffect(() => {
    if (topology) {
      let diagram;
      if (platform === 'vmware') {
          diagram = view === 'virtual' ? generateVirtualDiagram(topology) : generatePhysicalDiagram(topology);
      } else {
          diagram = generateHyperVDiagram(topology);
      }

      const container = document.getElementById('mermaid-container');
      if (container) {
        mermaid.render('mermaid-graph', diagram, (svgCode) => {
          const themedSvg = applyFluentTheme(svgCode, theme);
          setMermaidChart(themedSvg);
        });
      }
    }
  }, [topology, theme, view, platform]);

  const handleFileUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      setTopology(null);
      setMermaidChart('');

      const selected = await open({
        multiple: false,
        filters: [
            { name: 'Excel', extensions: ['xlsx'] },
            { name: 'JSON', extensions: ['json'] },
        ],
      });

      if (typeof selected === 'string') {
        let result: NetworkTopology;
        if (selected.endsWith('.xlsx')) {
            setPlatform('vmware');
            result = await invoke('get_network_topology', {
                filePath: selected,
            });
        } else {
            setPlatform('hyperv');
            const jsonContent = await readTextFile(selected);
            result = await invoke('get_network_topology_from_hyperv', {
                jsonContent,
            });
        }
        setTopology(result);
      }
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <Title1 as="h1">Network Visualizer</Title1>
      <Body1>
        Upload an RVTools or Hyper-V export file to visualize the network topology.
      </Body1>
      <div style={{ display: 'flex', gap: '16px' }}>
          <Button onClick={handleFileUpload} disabled={loading} appearance="primary">
            {loading ? 'Parsing...' : 'Upload Report'}
          </Button>
      </div>


      {error && <Card style={{ padding: '16px', color: 'red' }}>{error}</Card>}

      {loading && <Spinner label="Parsing and generating diagram..." />}

      {topology && (
        <Card style={{ padding: '16px' }}>
            <TabList selectedValue={platform} onTabSelect={(_, data) => setPlatform(data.value as any)}>
                <Tab value="vmware">VMware</Tab>
                <Tab value="hyperv">Hyper-V</Tab>
            </TabList>
            <TabList selectedValue={view} onTabSelect={(_, data) => setView(data.value as any)}>
                <Tab value="virtual">Virtual Diagram</Tab>
                <Tab value="physical">Physical Diagram</Tab>
            </TabList>

            <div id="mermaid-container" style={{marginTop: '16px'}}>
                {mermaidChart ? (
                <div dangerouslySetInnerHTML={{ __html: mermaidChart }} />
                ) : (
                <div id="mermaid-graph" style={{ display: 'none' }} />
                )}
            </div>
        </Card>
      )}
    </div>
  );
};

export default NetworkVisualizerView;
