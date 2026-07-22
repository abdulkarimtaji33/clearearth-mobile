import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-8">
          <Text className="text-5xl mb-4">🌱</Text>
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50 text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
            An unexpected error occurred. You can try again — if this keeps happening, contact your
            dispatcher.
          </Text>
          <Button label="Try again" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
