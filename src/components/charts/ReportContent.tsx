
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ReportContentProps {
  reportContent: string;
  isEditing: boolean;
  setReportContent: (content: string) => void;
}

const ReportContent: React.FC<ReportContentProps> = ({ 
  reportContent, 
  isEditing, 
  setReportContent 
}) => {
  return (
    <div className="mt-4">
      {isEditing ? (
        <Textarea
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          className="min-h-[500px] font-mono text-sm"
        />
      ) : (
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap">{reportContent}</pre>
        </div>
      )}
    </div>
  );
};

export default ReportContent;
