import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { ChevronRightRegular } from '@fluentui/react-icons';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface PurpleGlassBreadcrumbProps {
  items: BreadcrumbItem[];
  glass?: boolean;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '14px',
    flexWrap: 'wrap',
    fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '4px 8px',
    margin: '-4px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    ':hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      color: 'var(--brand-primary)',
    },
  },
  current: {
    color: 'var(--brand-primary)',
    fontWeight: '600',
    padding: '0',
    margin: '0',
    maxWidth: 'none',
    overflow: 'visible',
    ':hover': {
      backgroundColor: 'transparent',
      color: 'var(--brand-primary)',
    },
  },
  separator: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    flexShrink: 0,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    fontSize: '16px',
  },
});

export const PurpleGlassBreadcrumb: React.FC<PurpleGlassBreadcrumbProps> = ({
  items,
}) => {
  const classes = useStyles();

  return (
    <nav aria-label="Breadcrumb" className={classes.container}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index === items.length - 1 ? (
            // Current page - not clickable
            <span className={`${classes.item} ${classes.current}`} aria-current="page">
              {item.icon && <span className={classes.icon}>{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb
            <Link to={item.path || '#'} className={classes.item}>
              {item.icon && <span className={classes.icon}>{item.icon}</span>}
              {item.label}
            </Link>
          )}
          {index < items.length - 1 && (
            <ChevronRightRegular className={classes.separator} />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
