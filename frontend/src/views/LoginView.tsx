// Archer ITSM - Login View
// Authentication page with Purple Glass design system

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Button,
  Input,
  Label,
  Card,
  Text,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { ShieldCheckmark24Regular, LockClosed24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(18px) saturate(180%)',
    ...shorthands.padding(tokens.spacingVerticalXXXL, tokens.spacingHorizontalXXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow28,
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXXL,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    color: tokens.colorNeutralForegroundInverted,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    ':focus': {
      ...shorthands.border('1px', 'solid', tokens.colorBrandBackground),
    },
  },
  button: {
    marginTop: tokens.spacingVerticalM,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
    fontWeight: tokens.fontWeightSemibold,
    height: '44px',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  errorMessage: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
  },
  footer: {
    marginTop: tokens.spacingVerticalXXL,
    textAlign: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  testCredentials: {
    marginTop: tokens.spacingVerticalXL,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'dashed', 'rgba(139, 92, 246, 0.3)'),
  },
  testCredentialsTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  testCredentialsText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
  },
});

export default function LoginView() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Basic validation
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // Navigation happens in useEffect when isAuthenticated becomes true
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Login failed');
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <ShieldCheckmark24Regular />
          </div>
          <Text className={styles.title}>Welcome to Archer</Text>
          <Text className={styles.subtitle}>
            Sign in to your IT Service Management platform
          </Text>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {displayError && (
            <div className={styles.errorMessage}>{displayError}</div>
          )}

          <div className={styles.field}>
            <Label htmlFor="email" weight="semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@archer.local"
              disabled={isSubmitting}
              className={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="password" weight="semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isSubmitting}
              className={styles.input}
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            appearance="primary"
            size="large"
            disabled={isSubmitting}
            className={styles.button}
            icon={isSubmitting ? <Spinner size="tiny" /> : <LockClosed24Regular />}
          >
            {isSubmitting ? (
              <span className={styles.loadingContainer}>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Test credentials banner (only for development) */}
        {import.meta.env.DEV && (
          <div className={styles.testCredentials}>
            <div className={styles.testCredentialsTitle}>
              Development Test Credentials
            </div>
            <div className={styles.testCredentialsText}>
              Email: admin@archer.local
            </div>
            <div className={styles.testCredentialsText}>
              Password: ArcherAdmin123!
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <Text>
            Archer ITSM &copy; {new Date().getFullYear()}
            <br />
            The Modern ServiceNow Alternative
          </Text>
        </div>
      </Card>
    </div>
  );
}
