// src/components/shortcodes/su/SuTabs.tsx
import React, { useState } from 'react';
import { Tabs, Tab, Box, Paper } from '@mui/material';
import { ShortcodeComponentProps } from '../ShortcodeRegistry';

// Define the structure of a tab child element
interface TabChildProps {
  attributes?: {
    title?: string;
    [key: string]: any;
  };
  children?: React.ReactNode;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SuTabs: React.FC<ShortcodeComponentProps> = ({ attributes, children }) => {
  const [value, setValue] = useState(0);
  
  const {
    style = 'default',
    class: className,
  } = attributes || {};

  // Extract tab data from children
  const tabs = React.Children.toArray(children).filter((child): child is React.ReactElement<TabChildProps> => {
    if (!React.isValidElement(child)) return false;
    
    const props = child.props as TabChildProps;
    return props && 
           typeof props === 'object' &&
           'attributes' in props &&
           props.attributes?.title !== undefined;
  });

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Map SU tab styles to MUI
  const getTabsVariant = () => {
    switch (style) {
      case 'modern':
        return 'fullWidth';
      case 'simple':
        return 'standard';
      default:
        return 'standard';
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        my: 2,
        border: style === 'default' ? '1px solid' : 'none',
        borderColor: 'divider',
      }}
      className={className}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
          variant={getTabsVariant() as any}
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index: number) => (
            <Tab
              key={index}
              label={tab.props.attributes?.title || `Tab ${index + 1}`}
              sx={{
                textTransform: 'none',
                minHeight: 48,
              }}
            />
          ))}
        </Tabs>
      </Box>
      
      {tabs.map((tab, index: number) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.props.children || null}
        </TabPanel>
      ))}
    </Paper>
  );
};

export default SuTabs;