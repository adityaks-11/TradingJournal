import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabInterfaceProps {
  tabs: Tab[];
  defaultTabId?: string;
}

export const TabInterface: React.FC<TabInterfaceProps> = ({ 
  tabs, 
  defaultTabId 
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
  );

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="w-full">
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition-colors relative
              ${activeTabId === tab.id 
                ? 'text-teal-600 dark:text-teal-400' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }
            `}
          >
            {tab.label}
            {activeTabId === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {activeTab?.content}
      </div>
    </div>
  );
};
