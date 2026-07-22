import React from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ padded = true, elevated = true, className = '', children, ...rest }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 ${
        padded ? 'p-4' : ''
      } ${className}`}
      style={
        elevated
          ? {
              shadowColor: '#0A1628',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </View>
  );
}
