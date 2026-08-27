import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import Layout from '../../components/AppShell/Layout';
import Sidebar from '../../components/AppShell/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useChatStore } from '../../store/chatStore';

export default function ConversationDetailPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const { selectConversation, loadConversations } = useChatStore();

  useEffect(() => {
    loadConversations();
    if (conversationId && typeof conversationId === 'string') {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation, loadConversations]);

  return (
    <ProtectedRoute>
      <Layout showSidebar={true} sidebarComponent={<Sidebar />}>
        <ChatWindow />
      </Layout>
    </ProtectedRoute>
  );
}
