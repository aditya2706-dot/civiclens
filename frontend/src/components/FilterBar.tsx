"use client";

export default function FilterBar({ 
    selectedStatus, 
    setSelectedStatus, 
    searchQuery, 
    setSearchQuery 
}: { 
    selectedStatus: string, 
    setSelectedStatus: (status: string) => void,
    searchQuery: string,
    setSearchQuery: (query: string) => void
}) {
    const statuses = ["All", "Pending", "In Progress", "Resolved"];

    return (
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex flex-col gap-3 sticky top-0 z-40 relative">
            
            {/* Search */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search issues (e.g. Broken pipe)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                />
            </div>

            {/* Status Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            selectedStatus === status 
                            ? "bg-gray-900 text-white shadow-md"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
            
            {/* Fade effect for scrollbar-hide */}
            <div className="absolute right-0 bottom-3 top-14 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>
    );
}
