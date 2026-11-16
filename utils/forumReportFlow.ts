import {
  createForumReport,
  ForumReportError,
  type ForumReportTargetType,
} from '@/services/forumReportsApi';
import { promptVisitanteLogin } from '@/utils/visitanteAccess';
import { Alert } from 'react-native';

const CONFIRM_COPY: Record<
  ForumReportTargetType,
  { title: string; message: string }
> = {
  FORUM_POST: {
    title: 'Denunciar publicação',
    message:
      'Deseja denunciar este conteúdo? Nossa equipe irá analisar o relato. O post continua visível até a moderação.',
  },
  FORUM_COMMENT: {
    title: 'Denunciar comentário',
    message:
      'Deseja denunciar este comentário? Nossa equipe irá analisar o relato. O comentário continua visível até a moderação.',
  },
  FORUM_COMMUNITY: {
    title: 'Denunciar canal',
    message:
      'Deseja denunciar este canal? Nossa equipe irá analisar o relato. O canal continua visível até a moderação.',
  },
};

function showForumReportError(error: unknown): void {
  if (error instanceof ForumReportError) {
    switch (error.code) {
      case 'ALREADY_REPORTED':
        Alert.alert(
          'Denúncia já enviada',
          'Você já denunciou este conteúdo. Nossa equipe está analisando.',
        );
        return;
      case 'OWN_CONTENT':
        Alert.alert('Indisponível', 'Você não pode denunciar o próprio conteúdo.');
        return;
      case 'NOT_FOUND':
        Alert.alert(
          'Conteúdo indisponível',
          'Este item não foi encontrado. Ele pode ter sido removido.',
        );
        return;
      case 'FORBIDDEN':
        Alert.alert(
          'Não foi possível denunciar',
          error.message || 'Este conteúdo não pertence à sua cidade.',
        );
        return;
      case 'UNAUTHORIZED':
        Alert.alert('Sessão expirada', 'Faça login novamente para denunciar.');
        return;
      default:
        Alert.alert('Não foi possível denunciar', error.message || 'Tente novamente.');
        return;
    }
  }

  Alert.alert(
    'Não foi possível denunciar',
    error instanceof Error ? error.message : 'Tente novamente em instantes.',
  );
}

async function submitForumReport(
  targetType: ForumReportTargetType,
  targetId: string,
): Promise<void> {
  try {
    await createForumReport({
      targetType,
      targetId,
      reason: 'OTHER',
    });
    Alert.alert(
      'Denúncia enviada',
      'Obrigado. Sua denúncia foi registrada e será analisada pela moderação.',
    );
  } catch (e) {
    showForumReportError(e);
  }
}

export function confirmAndSubmitForumReport(
  targetType: ForumReportTargetType,
  targetId: string,
  options?: { canInteract?: boolean; loginPrompt?: string },
): void {
  const id = targetId.trim();
  if (!id) return;

  if (options?.canInteract === false) {
    promptVisitanteLogin(options.loginPrompt ?? 'denunciar no feed');
    return;
  }

  const copy = CONFIRM_COPY[targetType];
  Alert.alert(copy.title, copy.message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Denunciar',
      style: 'destructive',
      onPress: () => {
        void submitForumReport(targetType, id);
      },
    },
  ]);
}
