import React, { useState } from 'react';
import {
  Mail,
  Eye,
  MessageSquare,
  Calendar,
  Sparkles,
  UserCheck,
  PlusCircle,
  Clock,
  ShieldBan,
  Send,
  CheckCheck,
  Activity as ActivityIcon
} from 'lucide-react';
import Button from '../common/Button.jsx';
import { formatDateTime, timeAgo } from '../../utils/formatters.js';
import { leadService } from '../../services/leadService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ActivityTimeline({ lead, activities = [], onActivityLogged }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { success, error } = useToast();

  const activeCampaign =
    lead?.enrolledCampaigns?.find((c) => c.campaignStatus === 'ACTIVE') ||
    lead?.enrolledCampaigns?.[0];

  const hasSentEmail = activities.some(
    (a) => a.type === 'EMAIL_SENT' || a.type === 'FOLLOW_UP_SENT'
  );

  const isEligibleForOutreach =
    !!activeCampaign &&
    activeCampaign.campaignStatus === 'ACTIVE' &&
    lead?.emailVerificationStatus !== 'INVALID' &&
    lead?.leadHealth !== 'DO_NOT_CONTACT' &&
    lead?.status !== 'NOT_INTERESTED' &&
    lead?.status !== 'CONVERTED';

  const getSendEmailTitle = () => {
    if (hasSentEmail) return 'Day 0 initial email already sent';
    if (!activeCampaign) return 'Lead is not enrolled in any campaign';
    if (activeCampaign.campaignStatus !== 'ACTIVE')
      return `Campaign is ${activeCampaign.campaignStatus}. Must be ACTIVE to send outreach.`;
    if (lead?.emailVerificationStatus === 'INVALID')
      return 'Email address is invalid (Blocked by Campaign Guard)';
    if (lead?.leadHealth === 'DO_NOT_CONTACT' || lead?.status === 'NOT_INTERESTED')
      return 'Lead is on suppression list (DO_NOT_CONTACT)';
    if (lead?.status === 'CONVERTED')
      return 'Lead is already converted into a customer';
    return 'Send Day 0 Cadence Email with personalized variables';
  };

  const handleSendEmail = async () => {
    if (!lead?.id) return;
    if (!activeCampaign) {
      error('This lead is not enrolled in any campaign. Please enroll the lead in a campaign first.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await leadService.sendCadenceEmail(lead.id, activeCampaign.campaignId);
      success(res.message || 'Email submitted successfully.');
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      error(err.message || 'Email could not be sent. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSimulateAction = async (type, title, description, autoUpdateLeadStatus) => {
    if (!lead?.id) return;
    setIsSimulating(true);
    try {
      await leadService.logActivity(lead.id, {
        type,
        title,
        description,
        campaignId: activeCampaign?.campaignId || null,
        autoUpdateLeadStatus
      });
      success(`Activity logged: "${title}". Lead priority score & health updated!`);
      if (onActivityLogged) onActivityLogged();
    } catch (err) {
      error(err.message || 'Failed to log activity');
    } finally {
      setIsSimulating(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'EMAIL_SENT':
      case 'FOLLOW_UP_SENT':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'EMAIL_OPENED':
        return <Eye className="w-4 h-4 text-amber-600" />;
      case 'EMAIL_REPLIED':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'STATUS_CHANGED':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'CAMPAIGN_ADDED':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case 'CAMPAIGN_REMOVED':
        return <ShieldBan className="w-4 h-4 text-rose-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Engagement Simulator Bar */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Live Engagement Simulator
            </h4>
            <p className="text-[11px] text-slate-600">
              Execute Day 0 cadence email & simulate prospect reactions to watch scores and campaign metrics re-compute in MySQL.
            </p>
          </div>

          {activeCampaign && (
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                Campaign: {activeCampaign.campaignName} ({activeCampaign.campaignStatus})
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Day 0 Send Email Button */}
          <Button
            size="sm"
            variant="primary"
            disabled={isSendingEmail || isSimulating || !isEligibleForOutreach || hasSentEmail}
            isLoading={isSendingEmail}
            onClick={handleSendEmail}
            icon={hasSentEmail ? CheckCheck : Send}
            title={getSendEmailTitle()}
          >
            {isSendingEmail ? 'Sending email...' : hasSentEmail ? 'Email Sent' : 'Send Email'}
          </Button>

          {/* Simulate Open */}
          <Button
            size="sm"
            variant="outline"
            disabled={isSimulating || isSendingEmail}
            onClick={() =>
              handleSimulateAction(
                'EMAIL_OPENED',
                'Email Opened by Lead',
                'Lead opened subject line (+10 priority pts)'
              )
            }
            icon={Eye}
          >
            Simulate Open (+10 pts)
          </Button>

          {/* Simulate Reply */}
          <Button
            size="sm"
            variant="outline"
            disabled={isSimulating || isSendingEmail}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            onClick={() =>
              handleSimulateAction(
                'EMAIL_REPLIED',
                'Lead Replied to Outreach',
                'Lead replied expressing interest in architecture demo (+25 pts)',
                'REPLIED'
              )
            }
            icon={MessageSquare}
          >
            Simulate Reply (+25 pts)
          </Button>

          {/* Book Demo */}
          <Button
            size="sm"
            variant="success"
            disabled={isSimulating || isSendingEmail}
            onClick={() =>
              handleSimulateAction(
                'MEETING_SCHEDULED',
                'Discovery Demo Booked',
                'Demo meeting confirmed on calendar (+25 pts)',
                'MEETING'
              )
            }
            icon={Calendar}
          >
            Book Demo (+25 pts)
          </Button>
        </div>
      </div>

      {/* Chronological Timeline */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Activity History ({activities.length})
        </h4>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No activity records logged yet. Use the buttons above to send an email or simulate engagement.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                  {getActivityIcon(act.type)}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 transition-colors hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-xs text-slate-600 mt-1">{act.description}</p>
                  )}

                  {/* If metadata contains rendered subject/body, display cleanly */}
                  {act.metadata?.subject && (
                    <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                      <p className="font-semibold text-indigo-700 truncate">
                        Subject: {act.metadata.subject}
                      </p>
                      {act.metadata.body && (
                        <p className="text-slate-500 mt-1 whitespace-pre-line font-mono text-[10px] line-clamp-3">
                          {act.metadata.body}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                    {formatDateTime(act.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
