import Navbar from './Navbar';

export default function Layout({ children, showSidebar = false, sidebarComponent = null }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-navy-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && sidebarComponent}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
