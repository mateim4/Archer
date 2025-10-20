// FIX: Skeleton loading components for progressive loading
import React from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Skeleton,
  SkeletonItem,
  makeStyles,
  tokens
} from '@fluentui/react-components';

const useSkeletonStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100vh',
    padding: tokens.spacingHorizontalXL,
  },
  headerCard: {
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalXL,
    marginBottom: tokens.spacingVerticalXL,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  statsCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
  },
  tabContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
  contentCard: {
    padding: tokens.spacingVerticalXL,
  },
  // Layout utilities
  flexRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  flexRowCenter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRowGap: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  flexRowGapWrap: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  // Skeleton item styles
  skeletonMarginBottom: {
    marginBottom: tokens.spacingVerticalS,
  },
  skeletonMarginBottomM: {
    marginBottom: tokens.spacingVerticalM,
  },
  skeletonMarginBottomXS: {
    marginBottom: tokens.spacingVerticalXS,
  },
  skeletonWidth70: {
    marginBottom: tokens.spacingVerticalM,
    width: '70%',
  },
  skeletonWidth120: {
    width: '120px',
  },
  skeletonWidth80: {
    width: '80px',
  },
  skeletonWidth60: {
    width: '60px',
  },
  skeletonWidth100: {
    width: '100px',
  },
  skeletonWidth200: {
    width: '200px',
  },
  skeletonWidth250: {
    width: '250px',
  },
  skeletonWidth300: {
    width: '300px',
  },
  skeletonWidth350: {
    width: '350px',
  },
  skeletonWidth150: {
    width: '150px',
  },
  skeletonWidth40: {
    marginBottom: tokens.spacingVerticalXS,
    width: '40px',
  },
  skeletonWidth24: {
    width: '24px',
  },
  skeletonCircular: {
    borderRadius: tokens.borderRadiusCircular,
  },
  // Content layout
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  timelineContainer: {
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInner: {
    width: '100%',
    maxWidth: '600px',
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: tokens.spacingVerticalS,
  },
  itemRowBorder: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingMessage: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground2,
  },
  breadcrumb: {
    marginBottom: tokens.spacingVerticalL,
  },
  marginTopM: {
    marginTop: tokens.spacingVerticalM,
  },
  flex1: {
    flex: 1,
  },
  flex1MarginLeft: {
    flex: 1,
    marginLeft: tokens.spacingHorizontalXL,
  },
});

// FIX: Project header skeleton with proper Fluent 2 design
export const ProjectHeaderSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <Card className={styles.headerCard}>
      <CardHeader>
        <div className={styles.flexRow}>
          <div className={styles.flex1}>
            <Skeleton>
              <SkeletonItem size={32} className={styles.skeletonMarginBottom} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={16} className={styles.skeletonWidth70} />
            </Skeleton>
            <div className={styles.flexRowGapWrap}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i}>
                  <SkeletonItem size={16} className={styles.skeletonWidth120} />
                </Skeleton>
              ))}
            </div>
          </div>
          <div className={styles.flexRowGap}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i}>
                <SkeletonItem size={32} className={styles.skeletonWidth80} />
              </Skeleton>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardPreview>
        <div className={`${styles.flexRowCenter} ${styles.marginTopM}`}>
          <div>
            <Skeleton>
              <SkeletonItem size={24} className={styles.skeletonWidth60} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={12} className={styles.skeletonWidth100} />
            </Skeleton>
          </div>
          <div className={styles.flex1MarginLeft}>
            <Skeleton>
              <SkeletonItem size={8} className={styles.skeletonMarginBottomXS} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={12} className={styles.skeletonWidth200} />
            </Skeleton>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};

// FIX: Stats cards skeleton with proper spacing
export const StatsCardsSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <div className={styles.statsGrid}>
      {[1, 2, 3, 4].map(index => (
        <Card key={index} className={styles.statsCard}>
          <CardHeader>
            <div className={styles.flexRowCenter}>
              <div>
                <Skeleton>
                  <SkeletonItem size={24} className={styles.skeletonWidth40} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={12} className={styles.skeletonWidth80} />
                </Skeleton>
              </div>
              <Skeleton>
                <SkeletonItem size={40} className={styles.skeletonCircular} />
              </Skeleton>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

// FIX: Tab navigation skeleton
export const TabNavigationSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <div className={styles.tabContainer}>
      <div className={styles.flexRowGap}>
        {[1, 2, 3].map(index => (
          <Skeleton key={index}>
            <SkeletonItem size={32} className={styles.skeletonWidth100} />
          </Skeleton>
        ))}
      </div>
    </div>
  );
};

// FIX: Activity list skeleton for activities tab
export const ActivityListSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <Card className={styles.contentCard}>
      <CardHeader>
        <Skeleton>
          <SkeletonItem size={20} className={styles.skeletonWidth200} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={16} className={styles.skeletonWidth300} />
        </Skeleton>
      </CardHeader>
      <CardPreview>
        <div className={styles.flexColumn}>
          {[1, 2, 3, 4].map(index => (
            <Card key={index} className={styles.statsCard}>
              <CardHeader>
                <div className={styles.flexRow}>
                  <div>
                    <Skeleton>
                      <SkeletonItem size={16} className={styles.skeletonWidth250} />
                    </Skeleton>
                    <Skeleton>
                      <SkeletonItem size={12} className={styles.skeletonWidth80} />
                    </Skeleton>
                  </div>
                  <div className={styles.flexRowGap}>
                    <Skeleton>
                      <SkeletonItem size={24} className={styles.skeletonWidth24} />
                    </Skeleton>
                    <Skeleton>
                      <SkeletonItem size={24} className={styles.skeletonWidth24} />
                    </Skeleton>
                  </div>
                </div>
              </CardHeader>
              <CardPreview>
                <div className={styles.contentGrid}>
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <Skeleton>
                        <SkeletonItem size={12} className={styles.skeletonWidth60} />
                      </Skeleton>
                      <Skeleton>
                        <SkeletonItem size={16} className={styles.skeletonWidth100} />
                      </Skeleton>
                    </div>
                  ))}
                </div>
                <Skeleton>
                  <SkeletonItem size={8} className={styles.skeletonMarginBottomXS} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={12} className={styles.skeletonWidth60} />
                </Skeleton>
              </CardPreview>
            </Card>
          ))}
        </div>
      </CardPreview>
    </Card>
  );
};

// FIX: Timeline skeleton for timeline tab
export const TimelineSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <Card className={styles.contentCard}>
      <CardHeader>
        <Skeleton>
          <SkeletonItem size={20} className={styles.skeletonWidth150} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={16} className={styles.skeletonWidth350} />
        </Skeleton>
      </CardHeader>
      <CardPreview>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineInner}>
            {[1, 2, 3, 4, 5].map(index => (
              <div key={index} className={styles.timelineRow}>
                <Skeleton>
                  <SkeletonItem size={16} className={styles.skeletonWidth150} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={20} style={{ width: `${Math.random() * 300 + 100}px` }} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={16} className={styles.skeletonWidth80} />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};

// FIX: Overview skeleton for overview tab
export const OverviewSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <div className={styles.overviewGrid}>
      {[1, 2].map(cardIndex => (
        <Card key={cardIndex} className={styles.statsCard}>
          <CardHeader>
            <Skeleton>
              <SkeletonItem size={16} className={styles.skeletonWidth200} />
            </Skeleton>
          </CardHeader>
          <CardPreview>
            <div className={styles.flexColumn}>
              {[1, 2, 3, 4].map(itemIndex => (
                <div key={itemIndex} className={itemIndex < 4 ? styles.itemRowBorder : styles.itemRow}>
                  <Skeleton>
                    <SkeletonItem size={12} className={styles.skeletonWidth80} />
                  </Skeleton>
                  <Skeleton>
                    <SkeletonItem size={12} className={styles.skeletonWidth120} />
                  </Skeleton>
                </div>
              ))}
            </div>
          </CardPreview>
        </Card>
      ))}
    </div>
  );
};

// FIX: Full page skeleton combining all components
export const ProjectDetailViewSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <main className={styles.container} role="main" aria-label="Loading project details">
      {/* Loading message */}
      <div className={styles.loadingMessage}>
        Loading project details...
      </div>
      
      {/* Breadcrumb skeleton */}
      <div className={styles.breadcrumb}>
        <Skeleton>
          <SkeletonItem size={16} className={styles.skeletonWidth200} />
        </Skeleton>
      </div>

      <ProjectHeaderSkeleton />
      <StatsCardsSkeleton />
      <TabNavigationSkeleton />
      <ActivityListSkeleton />
    </main>
  );
};

export default ProjectDetailViewSkeleton;
