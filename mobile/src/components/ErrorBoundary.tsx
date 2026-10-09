/**
 * Catches a screen that fails while drawing, so the app shows a way back
 * instead of a blank screen. Nothing stored is lost: trying again redraws
 * the app from the start, and the messages are still on the phone.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { EmptyState } from './EmptyBoard';
import { SilkBackground } from './SilkBackground';
import { T } from './T';
import { PrimaryButton } from './ui';

type State = { failed: boolean; attempt: number };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Development builds only; message text is never logged.
    if (__DEV__) {
      console.error('MIRA screen failed:', error.message, info.componentStack);
    }
  }

  retry = () => this.setState(s => ({ failed: false, attempt: s.attempt + 1 }));

  render() {
    if (!this.state.failed) {
      // A new key draws the app again from the start after a retry.
      return <View key={this.state.attempt} className="flex-1">{this.props.children}</View>;
    }
    return (
      <View className="flex-1 justify-center gap-16 bg-silk-base px-24">
        <SilkBackground />
        <T accessibilityRole="header" className="text-28 font-bold">Something went wrong</T>
        <EmptyState
          title="This screen could not open"
          body="Your messages, drafts, and rules are still on this phone. Nothing was sent."
        />
        <PrimaryButton label="Try again" onPress={this.retry} />
      </View>
    );
  }
}
