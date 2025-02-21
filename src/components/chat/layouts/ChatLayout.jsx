import React from 'react';
import { Menu } from 'lucide-react';

export const ChatLayout = ({
  title,
  showSidebar = true,
  onToggleSidebar,
  sidebarContent,
  children,
}) => {
  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          {showSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
        {children}
      </div>
      {showSidebar && (
        <div className="hidden lg:block w-80 border-l dark:border-gray-700 bg-white dark:bg-gray-800">
          {sidebarContent}
        </div>
      )}
    </div>
  );
};

export default ChatLayout;