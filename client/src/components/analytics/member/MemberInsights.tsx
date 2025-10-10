import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { Insight } from '../../../types/analytics';
import { colors, spacing, radius, typography } from '../../../styles/designTokens';

interface MemberInsightsProps {
  insights: Insight[];
  className?: string;
  isDarkMode?: boolean;
}

const MemberInsights: React.FC<MemberInsightsProps> = ({
  insights,
  className = '',
  isDarkMode = false
}) => {
  const getInsightIcon = (type: string) => {
    const iconSize = "w-5 h-5"; // Reduced back to original size
    switch (type) {
      case 'danger':
        return (
          <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getInsightStyles = (type: string) => {
    if (isDarkMode) {
      switch (type) {
        case 'danger':
          return {
            backgroundColor: '#1F1B1B',
            borderColor: '#EF4444',
            iconColor: '#EF4444'
          };
        case 'warning':
          return {
            backgroundColor: '#1F1B0F',
            borderColor: '#F59E0B',
            iconColor: '#F59E0B'
          };
        case 'info':
          return {
            backgroundColor: '#0F1419',
            borderColor: '#3B82F6',
            iconColor: '#3B82F6'
          };
        case 'success':
          return {
            backgroundColor: '#0F1B0F',
            borderColor: '#10B981',
            iconColor: '#10B981'
          };
        default:
          return {
            backgroundColor: '#1F1F1F',
            borderColor: '#6B7280',
            iconColor: '#6B7280'
          };
      }
    } else {
      switch (type) {
        case 'danger':
          return {
            backgroundColor: '#FEF2F2',
            borderColor: '#EF4444',
            iconColor: '#EF4444'
          };
        case 'warning':
          return {
            backgroundColor: '#FFFBEB',
            borderColor: '#F59E0B',
            iconColor: '#F59E0B'
          };
        case 'info':
          return {
            backgroundColor: '#EFF6FF',
            borderColor: '#3B82F6',
            iconColor: '#3B82F6'
          };
        case 'success':
          return {
            backgroundColor: '#F0FDF4',
            borderColor: '#10B981',
            iconColor: '#10B981'
          };
        default:
          return {
            backgroundColor: '#F8FAFC',
            borderColor: '#6B7280',
            iconColor: '#6B7280'
          };
      }
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityStyles = isDarkMode ? {
      critical: { bg: '#1F1B1B', text: '#FCA5A5', label: 'Critical' },
      high: { bg: '#1F1B0F', text: '#FCD34D', label: 'High' },
      medium: { bg: '#0F1419', text: '#93C5FD', label: 'Medium' },
      low: { bg: '#0F1B0F', text: '#86EFAC', label: 'Low' }
    } : {
      critical: { bg: '#FEE2E2', text: '#991B1B', label: 'Critical' },
      high: { bg: '#FEF3C7', text: '#92400E', label: 'High' },
      medium: { bg: '#EFF6FF', text: '#1E40AF', label: 'Medium' },
      low: { bg: '#F0FDF4', text: '#065F46', label: 'Low' }
    };

    const style = severityStyles[severity as keyof typeof severityStyles] || severityStyles.low;

    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: style.bg, 
          color: style.text,
          borderRadius: `${radius.sm}px`
        }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <Card 
      className={`${className}`} 
      padding="lg" 
      isDarkMode={isDarkMode}
    >
      <SectionHeader
        label="PERFORMANCE INSIGHTS"
        title="Member Analysis"
        isDarkMode={isDarkMode}
      />
      
      <div 
        className="space-y-4"
        style={{ marginTop: `${spacing.md}px` }}
      >
        {insights.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ 
              color: isDarkMode ? colors.mutedText : colors.mutedText,
              paddingTop: `${spacing.lg}px`,
              paddingBottom: `${spacing.lg}px`
            }}
          >
            <svg 
              className="w-12 h-12 mx-auto mb-4 opacity-50" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ marginBottom: `${spacing.sm}px` }}
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p 
              className="text-sm"
              style={{ 
                fontSize: typography.small.fontSize,
                color: isDarkMode ? colors.mutedText : colors.mutedText
              }}
            >
              No insights available for this member.
            </p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            
            return (
              <div
                key={insight.id || index}
                className="flex items-start rounded-lg border-l-4 transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: styles.backgroundColor,
                  borderLeftColor: styles.borderColor,
                  padding: `${spacing.sm}px`,
                  borderRadius: `${radius.base}px`,
                  borderLeftWidth: '4px',
                  marginBottom: `${spacing.sm}px`
                }}
              >
                <div 
                  className="flex-shrink-0"
                  style={{ 
                    color: styles.iconColor,
                    marginTop: '1px',
                    marginRight: `${spacing.sm}px`
                  }}
                >
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-center justify-between mb-2"
                    style={{ marginBottom: `${spacing.xs}px` }}
                  >
                    <h4 
                      className="font-medium"
                      style={{ 
                        fontSize: typography.small.fontSize,
                        fontWeight: typography.small.fontWeight,
                        color: isDarkMode ? 'white' : colors.neutralText
                      }}
                    >
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Alert
                    </h4>
                    {getSeverityBadge(insight.severity)}
                  </div>
                  
                  <p 
                    className="mb-3 leading-relaxed"
                    style={{ 
                      fontSize: typography.small.fontSize,
                      lineHeight: typography.small.lineHeight,
                      marginBottom: `${spacing.xs}px`,
                      color: isDarkMode ? '#E5E7EB' : colors.neutralText
                    }}
                  >
                    {insight.message}
                  </p>
                  
                  {insight.action && (
                    <div 
                      className="rounded-md p-3"
                      style={{ 
                        backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                        padding: `${spacing.xs}px`,
                        borderRadius: `${radius.sm}px`,
                        marginTop: `${spacing.xs}px`
                      }}
                    >
                      <p 
                        className="font-medium mb-1"
                        style={{ 
                          fontSize: typography.caption.fontSize,
                          fontWeight: typography.caption.fontWeight,
                          textTransform: typography.caption.textTransform,
                          letterSpacing: typography.caption.letterSpacing,
                          marginBottom: `${spacing.xs / 4}px`,
                          color: isDarkMode ? '#9CA3AF' : colors.mutedText
                        }}
                      >
                        RECOMMENDED ACTION:
                      </p>
                      <p 
                        className="leading-relaxed"
                        style={{ 
                          fontSize: typography.caption.fontSize,
                          lineHeight: typography.caption.lineHeight,
                          color: isDarkMode ? '#E5E7EB' : colors.neutralText
                        }}
                      >
                        {insight.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default MemberInsights;
