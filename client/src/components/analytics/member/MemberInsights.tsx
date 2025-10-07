import React from 'react';
import Card from '../shared/Card';
import SectionHeader from '../shared/SectionHeader';
import { Insight } from '../../../types/analytics';
import { colors } from '../../../styles/designTokens';

interface MemberInsightsProps {
  insights: Insight[];
  className?: string;
}

const MemberInsights: React.FC<MemberInsightsProps> = ({
  insights,
  className = ''
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getInsightStyles = (type: string) => {
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
  };

  const getSeverityBadge = (severity: string) => {
    const severityStyles = {
      critical: { bg: '#FEE2E2', text: '#991B1B', label: 'Critical' },
      high: { bg: '#FEF3C7', text: '#92400E', label: 'High' },
      medium: { bg: '#EFF6FF', text: '#1E40AF', label: 'Medium' },
      low: { bg: '#F0FDF4', text: '#065F46', label: 'Low' }
    };

    const style = severityStyles[severity as keyof typeof severityStyles] || severityStyles.low;

    return (
      <span 
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <SectionHeader
        label="PERFORMANCE INSIGHTS"
        title="Member Analysis"
      />
      
      <div className="mt-6 space-y-4">
        {insights.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: colors.mutedText }}
          >
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>No insights available for this member.</p>
          </div>
        ) : (
          insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            
            return (
              <div
                key={insight.id || index}
                className="flex items-start space-x-4 p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: styles.backgroundColor,
                  borderLeftColor: styles.borderColor
                }}
              >
                <div 
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: styles.iconColor }}
                >
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 
                      className="text-sm font-medium"
                      style={{ color: colors.neutralText }}
                    >
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Alert
                    </h4>
                    {getSeverityBadge(insight.severity)}
                  </div>
                  
                  <p 
                    className="text-sm mb-2"
                    style={{ color: colors.neutralText }}
                  >
                    {insight.message}
                  </p>
                  
                  {insight.action && (
                    <div className="mt-3 p-3 rounded-md" style={{ backgroundColor: colors.cardBg }}>
                      <p className="text-xs font-medium mb-1" style={{ color: colors.mutedText }}>
                        RECOMMENDED ACTION:
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.neutralText }}
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
