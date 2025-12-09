// Archer ITSM - Unauthorized View
// Displayed when user lacks required permissions

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { LockClosed24Regular, ArrowLeft24Regular } from '@fluentui/react-icons';

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
    maxWidth: '520px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(18px) saturate(180%)',
    ...shorthands.padding(tokens.spacingVerticalXXXL, tokens.spacingHorizontalXXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow28,
    ...shorthands.border('1px', 'solid', 'rgba(239, 68, 68, 0.15)'),
    textAlign: 'center',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    margin: '0 auto',
    marginBottom: tokens.spacingVerticalL,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    color: tokens.colorPaletteRedForeground1,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  message: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalXXL,
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  button: {
    height: '44px',
  },
});

export default function UnauthorizedView() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as any;
  const reason = state?.reason || 'unknown';
  const fromPath = state?.from?.pathname;

  const getMessage = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return 'You do not have the necessary permissions to access this resource. Please contact your system administrator if you believe this is an error.';
      case 'insufficient_role':
        return 'Your current role does not allow access to this feature. Please contact your system administrator to request appropriate access.';
      default:
        return 'You are not authorized to access this page. Please contact your system administrator for assistance.';
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.icon}>
          <LockClosed24Regular style={{ fontSize: '32px' }} />
        </div>
        <Text className={styles.title}>Access Denied</Text>
        <Text className={styles.message}>{getMessage()}</Text>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            size="large"
            icon={<ArrowLeft24Regular />}
            onClick={() => navigate(-1)}
            className={styles.button}
          >
            Go Back
          </Button>
          <Button
            appearance="subtle"
            size="large"
            onClick={() => navigate('/dashboard')}
            className={styles.button}
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
