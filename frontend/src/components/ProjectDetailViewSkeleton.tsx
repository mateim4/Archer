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
});

// FIX: Project header skeleton with proper Fluent 2 design
export const ProjectHeaderSkeleton: React.FC = () => {
  const styles = useSkeletonStyles();

  return (
    <Card className={styles.headerCard}>
      <CardHeader>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          width: '100%'
        }}>
          <div style={{ flex: 1 }}>
            <Skeleton>
              <SkeletonItem size={32} style={{ marginBottom: tokens.spacingVerticalS }} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={16} style={{ marginBottom: tokens.spacingVerticalM, width: '70%' }} />
            </Skeleton>
            <div style={{ 
              display: 'flex', 
              gap: tokens.spacingHorizontalL,
              flexWrap: 'wrap'
            }}>
              {[1, 2, 3].map(i => (
                <Skeleton key={i}>
                  <SkeletonItem size={16} style={{ width: '120px' }} />
                </Skeleton>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i}>
                <SkeletonItem size={32} style={{ width: '80px' }} />
              </Skeleton>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardPreview>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: tokens.spacingVerticalM
        }}>
          <div>
            <Skeleton>
              <SkeletonItem size={24} style={{ marginBottom: tokens.spacingVerticalXS, width: '60px' }} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={12} style={{ width: '100px' }} />
            </Skeleton>
          </div>
          <div style={{ flex: 1, marginLeft: tokens.spacingHorizontalXL }}>
            <Skeleton>
              <SkeletonItem size={8} style={{ marginBottom: tokens.spacingVerticalXS }} />
            </Skeleton>
            <Skeleton>
              <SkeletonItem size={12} style={{ width: '200px' }} />
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <Skeleton>
                  <SkeletonItem size={24} style={{ marginBottom: tokens.spacingVerticalXS, width: '40px' }} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={12} style={{ width: '80px' }} />
                </Skeleton>
              </div>
              <Skeleton>
                <SkeletonItem size={40} style={{ borderRadius: tokens.borderRadiusCircular }} />
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
      <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
        {[1, 2, 3].map(index => (
          <Skeleton key={index}>
            <SkeletonItem size={32} style={{ width: '100px' }} />
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
          <SkeletonItem size={20} style={{ marginBottom: tokens.spacingVerticalXS, width: '200px' }} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: '300px' }} />
        </Skeleton>
      </CardHeader>
      <CardPreview>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
          {[1, 2, 3, 4].map(index => (
            <Card key={index} className={styles.statsCard}>
              <CardHeader>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <Skeleton>
                      <SkeletonItem size={16} style={{ marginBottom: tokens.spacingVerticalXS, width: '250px' }} />
                    </Skeleton>
                    <Skeleton>
                      <SkeletonItem size={12} style={{ width: '80px' }} />
                    </Skeleton>
                  </div>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
                    <Skeleton>
                      <SkeletonItem size={24} style={{ width: '24px' }} />
                    </Skeleton>
                    <Skeleton>
                      <SkeletonItem size={24} style={{ width: '24px' }} />
                    </Skeleton>
                  </div>
                </div>
              </CardHeader>
              <CardPreview>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: tokens.spacingHorizontalM,
                  marginBottom: tokens.spacingVerticalM
                }}>
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <Skeleton>
                        <SkeletonItem size={12} style={{ marginBottom: tokens.spacingVerticalXS, width: '60px' }} />
                      </Skeleton>
                      <Skeleton>
                        <SkeletonItem size={16} style={{ width: '100px' }} />
                      </Skeleton>
                    </div>
                  ))}
                </div>
                <Skeleton>
                  <SkeletonItem size={8} style={{ marginBottom: tokens.spacingVerticalXS }} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={12} style={{ width: '60px' }} />
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
          <SkeletonItem size={20} style={{ marginBottom: tokens.spacingVerticalXS, width: '150px' }} />
        </Skeleton>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: '350px' }} />
        </Skeleton>
      </CardHeader>
      <CardPreview>
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            {[1, 2, 3, 4, 5].map(index => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: tokens.spacingHorizontalM,
                marginBottom: tokens.spacingVerticalL
              }}>
                <Skeleton>
                  <SkeletonItem size={16} style={{ width: '150px' }} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={20} style={{ width: `${Math.random() * 300 + 100}px` }} />
                </Skeleton>
                <Skeleton>
                  <SkeletonItem size={16} style={{ width: '80px' }} />
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
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: tokens.spacingHorizontalL
    }}>
      {[1, 2].map(cardIndex => (
        <Card key={cardIndex} className={styles.statsCard}>
          <CardHeader>
            <Skeleton>
              <SkeletonItem size={16} style={{ width: '200px' }} />
            </Skeleton>
          </CardHeader>
          <CardPreview>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
              {[1, 2, 3, 4].map(itemIndex => (
                <div key={itemIndex} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingBottom: tokens.spacingVerticalS,
                  borderBottom: itemIndex < 3 ? `1px solid ${tokens.colorNeutralStroke2}` : 'none'
                }}>
                  <Skeleton>
                    <SkeletonItem size={12} style={{ width: '80px' }} />
                  </Skeleton>
                  <Skeleton>
                    <SkeletonItem size={12} style={{ width: '120px' }} />
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
      <div style={{ 
        textAlign: 'center', 
        marginBottom: tokens.spacingVerticalXL,
        color: tokens.colorNeutralForeground2
      }}>
        Loading project details...
      </div>
      
      {/* Breadcrumb skeleton */}
      <div style={{ marginBottom: tokens.spacingVerticalL }}>
        <Skeleton>
          <SkeletonItem size={16} style={{ width: '200px' }} />
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
