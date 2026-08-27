import { useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import Layout from '../../components/AppShell/Layout';
import Sidebar from '../../components/AppShell/Sidebar';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import { useChatStore } from '../../store/chatStore';

export default function ChatIndexPage() {
  const { loadConversations } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <ProtectedRoute>
      <Layout showSidebar={true} sidebarComponent={<Sidebar />}>
        <ChatWindow />
      </Layout>
    </ProtectedRoute>
  );
}
