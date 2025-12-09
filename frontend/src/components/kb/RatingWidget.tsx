import React, { useState } from 'react';
import { PurpleGlassButton, PurpleGlassTextarea, PurpleGlassCard } from '../ui';
import { ThumbLikeRegular, ThumbLikeFilled, ThumbDislikeRegular, ThumbDislikeFilled, SendRegular } from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';

export interface RatingWidgetProps {
  articleId: string;
  currentRating?: { is_helpful: boolean; feedback?: string };
  helpfulCount: number;
  notHelpfulCount: number;
  onSubmitRating: (is_helpful: boolean, feedback?: string) => Promise<void>;
}

/**
 * RatingWidget - Article feedback and rating component
 * 
 * Features:
 * - Thumbs up/down rating
 * - Optional feedback text
 * - Shows helpful/not helpful counts
 * - Submit feedback to backend
 */
export const RatingWidget: React.FC<RatingWidgetProps> = ({
  articleId,
  currentRating,
  helpfulCount,
  notHelpfulCount,
  onSubmitRating,
}) => {
  const [selectedRating, setSelectedRating] = useState<boolean | null>(
    currentRating ? currentRating.is_helpful : null
  );
  const [feedback, setFeedback] = useState(currentRating?.feedback || '');
  const [showFeedback, setShowFeedback] = useState(!!currentRating?.feedback);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = async (is_helpful: boolean) => {
    if (selectedRating === is_helpful) {
      // Deselect if clicking the same rating
      setSelectedRating(null);
      setShowFeedback(false);
      return;
    }

    setSelectedRating(is_helpful);
    setShowFeedback(true);

    // Submit rating without feedback if no feedback shown
    if (!showFeedback && !feedback) {
      setIsSubmitting(true);
      try {
        await onSubmitRating(is_helpful);
      } catch (error) {
        console.error('Failed to submit rating:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitFeedback = async () => {
    if (selectedRating === null) return;

    setIsSubmitting(true);
    try {
      await onSubmitRating(selectedRating, feedback || undefined);
      setShowFeedback(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = helpfulCount + notHelpfulCount;
  const helpfulPercentage = totalVotes > 0 ? Math.round((helpfulCount / totalVotes) * 100) : 0;

  return (
    <PurpleGlassCard style={{ padding: tokens.spacingVerticalL }}>
      <div style={{
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        marginBottom: tokens.spacingVerticalM,
      }}>
        Was this article helpful?
      </div>

      {/* Rating Buttons */}
      <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'center', marginBottom: tokens.spacingVerticalM }}>
        <PurpleGlassButton
          variant={selectedRating === true ? 'primary' : 'ghost'}
          onClick={() => handleRatingClick(true)}
          disabled={isSubmitting}
          icon={selectedRating === true ? <ThumbLikeFilled /> : <ThumbLikeRegular />}
        >
          Helpful ({helpfulCount})
        </PurpleGlassButton>
        
        <PurpleGlassButton
          variant={selectedRating === false ? 'danger' : 'ghost'}
          onClick={() => handleRatingClick(false)}
          disabled={isSubmitting}
          icon={selectedRating === false ? <ThumbDislikeFilled /> : <ThumbDislikeRegular />}
        >
          Not Helpful ({notHelpfulCount})
        </PurpleGlassButton>

        {totalVotes > 0 && (
          <div style={{
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground3,
            marginLeft: 'auto',
          }}>
            {helpfulPercentage}% found this helpful
          </div>
        )}
      </div>

      {/* Feedback Text Area */}
      {showFeedback && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <PurpleGlassTextarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us how we can improve this article... (optional)"
            rows={3}
          />
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, justifyContent: 'flex-end', marginTop: tokens.spacingVerticalS }}>
            <PurpleGlassButton
              variant="ghost"
              onClick={() => {
                setShowFeedback(false);
                setFeedback('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="primary"
              onClick={handleSubmitFeedback}
              disabled={isSubmitting || selectedRating === null}
              icon={<SendRegular />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </PurpleGlassButton>
          </div>
        </div>
      )}
    </PurpleGlassCard>
  );
};
