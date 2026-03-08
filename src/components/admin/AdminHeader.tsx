interface AdminHeaderProps {
  onSignOut: () => void;
}

const AdminHeader = ({ onSignOut }: AdminHeaderProps) => (
  <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
    <h1 className="font-heading font-bold text-xl text-foreground">GegoBooks Admin</h1>
    <button onClick={onSignOut} className="font-body text-sm text-muted hover:text-foreground">
      Sign Out
    </button>
  </header>
);

export default AdminHeader;
