export default function Header() {
    return (
        <header className="bg-thw-blue text-white">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-white"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.2" />
                        <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">THW Design Toolbox</h1>
                        <p className="text-sm text-white/70">Corporate Design Medien erstellen</p>
                    </div>
                </div>
            </div>
        </header>
    )
}
