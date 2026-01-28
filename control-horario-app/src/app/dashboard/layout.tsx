import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* Sidebar hidden on mobile for now, accessible via menu later */}
            <div className="hidden md:block h-full">
                <Sidebar />
            </div>

            <main className="flex-1 h-full overflow-y-auto w-full">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
