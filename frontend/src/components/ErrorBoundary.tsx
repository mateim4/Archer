// FIX: React Error Boundary for graceful error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Title2,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ErrorCircleRegular, ArrowClockwiseRegular } from '@fluentui/react-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

const useErrorBoundaryStyles = makeStyles({
  errorCard: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
    marginTop: tokens.spacingVerticalXXL,
  },
  errorIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteRedForeground1,
    marginBottom: tokens.spacingVerticalL,
  },
  errorDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '200px',
  },
});

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorBoundaryFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}

interface FallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
}

const ErrorBoundaryFallback: React.FC<FallbackProps> = ({ error, errorInfo, onRetry }) => {
  const styles = useErrorBoundaryStyles();
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div style={{ padding: tokens.spacingHorizontalXL }}>
      <Card className={styles.errorCard}>
        <CardHeader>
          <ErrorCircleRegular className={styles.errorIcon} />
          <Title2>Something went wrong</Title2>
        </CardHeader>
        <CardPreview>
          <Text>
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </Text>
          
          <div style={{ 
            display: 'flex', 
            gap: tokens.spacingHorizontalM, 
            justifyContent: 'center',
            marginTop: tokens.spacingVerticalL 
          }}>
            <Button 
              appearance="primary" 
              icon={<ArrowClockwiseRegular />}
              onClick={onRetry}
            >
              Try Again
            </Button>
            <Button 
              appearance="secondary"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {showDetails && (
            <div className={styles.errorDetails}>
              <strong>Error:</strong> {error?.message}
              {error?.stack && (
                <>
                  <br /><br />
                  <strong>Stack Trace:</strong>
                  <br />
                  {error.stack}
                </>
              )}
              {errorInfo?.componentStack && (
                <>
                  <br /><br />
                  <strong>Component Stack:</strong>
                  <br />
                  {errorInfo.componentStack}
                </>
              )}
            </div>
          )}
        </CardPreview>
      </Card>
    </div>
  );
};

export default ErrorBoundary;
