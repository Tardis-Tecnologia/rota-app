import ForumRestrictionModal from '@/components/forum/ForumRestrictionModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  isForumInactiveUserError,
  isForumPostingSuspendedError,
} from '@/services/forumApiError';
import {
  getMyForumRestrictions,
  type ForumMeRestrictionsDto,
} from '@/services/forumRestrictionsApi';
import { applyForumInactiveLogout } from '@/utils/forumBanFlow';
import { parsePostingSuspensionMessage } from '@/utils/forumPostingSuspensionParse';
import { useFocusEffect } from '@react-navigation/native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type RestrictionModalState = {
  visible: boolean;
  title: string;
  message: string;
  variant: 'suspend' | 'ban' | 'generic';
};

type ForumModerationContextValue = {
  restrictions: ForumMeRestrictionsDto | null;
  canPublish: boolean;
  canComment: boolean;
  isLoadingRestrictions: boolean;
  refreshRestrictions: () => Promise<ForumMeRestrictionsDto | null>;
  requestForumPublish: (openPublish: () => void) => Promise<void>;
  requestForumComment: (sendComment: () => void) => Promise<void>;
  showRestrictionMessage: (message?: string | null, title?: string) => void;
  handleForumApiError: (error: unknown) => Promise<boolean>;
};

const defaultRestrictions: ForumMeRestrictionsDto = {
  hostId: '',
  active: true,
  isBanned: false,
  isSuspended: false,
  suspendedUntil: null,
  suspensionReason: null,
  canPublish: true,
  canComment: true,
  message: null,
};

const hiddenModal: RestrictionModalState = {
  visible: false,
  title: '',
  message: '',
  variant: 'generic',
};

const ForumModerationContext = createContext<ForumModerationContextValue | null>(null);

export function ForumModerationProvider({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [restrictions, setRestrictions] = useState<ForumMeRestrictionsDto | null>(null);
  const [loadingRestrictions, setLoadingRestrictions] = useState(false);
  const [modal, setModal] = useState<RestrictionModalState>(hiddenModal);

  const closeModal = useCallback(() => {
    setModal(hiddenModal);
  }, []);

  const enforceBanned = useCallback(
    async (_serverMessage?: string | null) => {
      closeModal();
      await applyForumInactiveLogout(logout);
    },
    [closeModal, logout],
  );

  const showRestrictionMessage = useCallback(
    (message?: string | null, title?: string) => {
      const r = restrictions;
      setModal({
        visible: true,
        title: title ?? (r?.isSuspended ? 'Conta suspensa no fórum' : 'Ação indisponível'),
        message:
          message?.trim() ||
          r?.message?.trim() ||
          'Esta ação não está disponível para sua conta no momento.',
        variant: r?.isBanned ? 'ban' : r?.isSuspended ? 'suspend' : 'generic',
      });
    },
    [restrictions],
  );

  const applyRestrictions = useCallback(
    async (next: ForumMeRestrictionsDto): Promise<ForumMeRestrictionsDto> => {
      setRestrictions(next);

      if (!next.active || next.isBanned) {
        await enforceBanned(next.message);
        return next;
      }

      return next;
    },
    [enforceBanned],
  );

  const refreshRestrictions = useCallback(async (): Promise<ForumMeRestrictionsDto | null> => {
    if (!user?.id?.trim()) {
      setRestrictions(null);
      return null;
    }

    setLoadingRestrictions(true);
    try {
      const next = await getMyForumRestrictions();
      await applyRestrictions(next);
      return next;
    } catch (e) {
      if (isForumInactiveUserError(e)) {
        await enforceBanned(e instanceof Error ? e.message : null);
        return null;
      }
      return restrictions;
    } finally {
      setLoadingRestrictions(false);
    }
  }, [applyRestrictions, enforceBanned, restrictions, user?.id]);

  useEffect(() => {
    if (!isLoading && user?.id) {
      void refreshRestrictions();
    }
    if (!user) {
      setRestrictions(null);
      closeModal();
    }
  }, [closeModal, isLoading, refreshRestrictions, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        void refreshRestrictions();
      }
    }, [refreshRestrictions, user?.id]),
  );

  const requestForumPublish = useCallback(
    async (openPublish: () => void) => {
      const next = (await refreshRestrictions()) ?? restrictions ?? defaultRestrictions;

      if (!next.active || next.isBanned) {
        return;
      }

      if (!next.canPublish) {
        showRestrictionMessage(
          next.message,
          next.isSuspended ? 'Conta suspensa de publicação' : 'Publicação indisponível',
        );
        return;
      }

      openPublish();
    },
    [refreshRestrictions, restrictions, showRestrictionMessage],
  );

  const requestForumComment = useCallback(
    async (sendComment: () => void) => {
      const next = (await refreshRestrictions()) ?? restrictions ?? defaultRestrictions;

      if (!next.active || next.isBanned) {
        return;
      }

      if (!next.canComment) {
        showRestrictionMessage(
          next.message,
          next.isSuspended ? 'Comentários indisponíveis' : 'Comentário indisponível',
        );
        return;
      }

      sendComment();
    },
    [refreshRestrictions, restrictions, showRestrictionMessage],
  );

  const handleForumApiError = useCallback(
    async (error: unknown): Promise<boolean> => {
      if (isForumInactiveUserError(error)) {
        await enforceBanned(error instanceof Error ? error.message : null);
        return true;
      }

      const next = await refreshRestrictions();

      if (isForumPostingSuspendedError(error)) {
        showRestrictionMessage(
          error.message || next?.message,
          'Conta suspensa de publicação',
        );
        return true;
      }

      if (error instanceof Error) {
        const parsed = parsePostingSuspensionMessage(error.message);
        if (parsed) {
          showRestrictionMessage(error.message, 'Conta suspensa de publicação');
          return true;
        }
      }

      if (next && (!next.canPublish || !next.canComment) && next.message) {
        showRestrictionMessage(next.message);
        return true;
      }

      return false;
    },
    [enforceBanned, refreshRestrictions, showRestrictionMessage],
  );

  const effective = restrictions ?? defaultRestrictions;

  const value = useMemo<ForumModerationContextValue>(
    () => ({
      restrictions,
      canPublish: effective.canPublish,
      canComment: effective.canComment,
      isLoadingRestrictions: loadingRestrictions,
      refreshRestrictions,
      requestForumPublish,
      requestForumComment,
      showRestrictionMessage,
      handleForumApiError,
    }),
    [
      effective.canComment,
      effective.canPublish,
      handleForumApiError,
      loadingRestrictions,
      refreshRestrictions,
      requestForumComment,
      requestForumPublish,
      restrictions,
      showRestrictionMessage,
    ],
  );

  return (
    <ForumModerationContext.Provider value={value}>
      {children}
      <ForumRestrictionModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        suspendedUntil={restrictions?.suspendedUntil}
        suspensionReason={restrictions?.suspensionReason}
        onClose={closeModal}
      />
    </ForumModerationContext.Provider>
  );
}

export function useForumModeration(): ForumModerationContextValue {
  const ctx = useContext(ForumModerationContext);
  if (!ctx) {
    return {
      restrictions: null,
      canPublish: true,
      canComment: true,
      isLoadingRestrictions: false,
      refreshRestrictions: async () => null,
      requestForumPublish: async (open) => open(),
      requestForumComment: async (send) => send(),
      showRestrictionMessage: () => {},
      handleForumApiError: async () => false,
    };
  }
  return ctx;
}
