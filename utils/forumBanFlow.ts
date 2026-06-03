import {
  buildForumBannedNoticeMessage,
  saveForumBanNotice,
} from '@/services/forumBanNoticeStore';

export async function applyForumInactiveLogout(
  logout: () => Promise<void>,
  moderatorReason?: string | null,
): Promise<void> {
  await saveForumBanNotice(buildForumBannedNoticeMessage(moderatorReason));
  await logout();
}

/** @deprecated */
export const applyForumBanLogout = applyForumInactiveLogout;
