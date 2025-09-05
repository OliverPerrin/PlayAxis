import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import clsx from 'clsx';

const Panel = ({ className = '', children, padding = 'p-6', rounded = 'rounded-2xl', as: Tag = 'div' }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  return (
    <Tag
      className={clsx(
        rounded,
        padding,
        'border transition-colors',
        isDark
          ? 'bg-white/10 backdrop-blur-lg border-white/20'
          : 'bg-white border-slate-200 shadow-sm',
        className
      )}
    >
      {children}
    </Tag>
  );
};

export default Panel;