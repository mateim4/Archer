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
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} 0`,
    fontSize: tokens.fontSizeBase300,
    flexWrap: 'wrap',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3, // Grey like chevron
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
  },
  current: {
    color: tokens.colorBrandForeground1, // Purple
    fontWeight: tokens.fontWeightSemibold,
    textDecoration: 'underline',
    textDecorationColor: tokens.colorBrandForeground1,
    textUnderlineOffset: '4px',
    maxWidth: 'none', // Never truncate current step
    overflow: 'visible',
  },
  separator: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
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
