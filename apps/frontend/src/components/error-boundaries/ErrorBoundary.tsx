"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Card, Center, Code, Group, Stack, Text, Title, rem } from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree.
 *
 * Features:
 * - Catches errors in child components
 * - Displays fallback UI
 * - Logs error information
 * - Provides retry functionality
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Center p="xl">
          <Card withBorder shadow="sm" style={{ maxWidth: 500, width: "100%" }}>
            <Stack align="center" gap="md">
              <IconAlertCircle size={rem(48)} color="var(--mantine-color-red-6)" />

              <Title order={3}>Something went wrong</Title>

              <Text c="dimmed" ta="center">
                We encountered an error while loading this component.
              </Text>

              {process.env.NODE_ENV !== "production" && this.state.error && (
                <Card p="sm" style={{ width: "100%" }} withBorder>
                  <Text size="xs" fw={500}>
                    Error Details:
                  </Text>
                  <Text size="xs" mt="xs">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <Text size="xs" fw={500} mt="md">
                        Component Stack:
                      </Text>
                      <Code block>{this.state.errorInfo.componentStack}</Code>
                    </>
                  )}
                </Card>
              )}

              <Group>
                <Button onClick={this.handleRetry} leftSection={<IconRefresh size={rem(16)} />}>
                  Try Again
                </Button>
              </Group>
            </Stack>
          </Card>
        </Center>
      );
    }

    return this.props.children;
  }
}
