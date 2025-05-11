// Report Interfaces
export interface ReportPost {
    report_id: number;
    post_id: number;
    reported_by: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
}

export interface ReportComment {
    report_id: number;
    comment_id: number;
    reported_by: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
}
