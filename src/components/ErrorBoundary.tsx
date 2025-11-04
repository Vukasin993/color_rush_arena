import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error, eventId: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ErrorBoundary details:', error, errorInfo);
    
    // Send error to Sentry with component stack
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      scope.setLevel('error');
      scope.setTag('error_boundary', 'true');
      
      const eventId = Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
      
      this.setState({ eventId });
    });
  }

  handleReset = () => {
    Sentry.addBreadcrumb({
      category: 'user_action',
      message: 'User reset error boundary',
      level: 'info',
    });
    this.setState({ hasError: false, error: null, eventId: null });
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.captureFeedback({
        message: `Error: ${this.state.error?.message || 'Unknown error'}`,
        associatedEventId: this.state.eventId,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>🚨 Something went wrong</Text>
            <Text style={styles.subtitle}>The app encountered an unexpected error</Text>
            
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown error occurred'}
              </Text>
              {__DEV__ && this.state.error?.stack && (
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            
            {!__DEV__ && (
              <Text style={styles.reportText}>
                Error has been automatically reported to our team
              </Text>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    width: '100%',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8E2DE2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stackText: {
    color: '#FF6B6B',
    fontSize: 10,
    marginTop: 10,
    fontFamily: 'monospace',
  },
  reportText: {
    color: '#B8B8D1',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
});