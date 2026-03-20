// Haversine formula to get distance between two lat/lng pairs in kilometers
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Greedy Nearest-Neighbor algorithm to sort reports into an optimized itinerary path
export function optimizeRoute(currentLocation: {lat: number, lng: number}, reports: any[]) {
    // Only target unresolved reports with valid GPS data
    const activeReports = reports.filter(r => 
        r.status !== 'Resolved' && r.status !== 'Solved' && 
        r.location && r.location.lat && r.location.lng
    );
    
    if (activeReports.length === 0) return [];

    let unvisited = [...activeReports];
    let path = [];
    let currentPoint = currentLocation;

    // Iteratively build the path jumping to the nearest next stop
    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        // Find the nearest unvisited report from our current point
        for (let i = 0; i < unvisited.length; i++) {
            const dest = unvisited[i].location;
            const dist = getDistance(currentPoint.lat, currentPoint.lng, dest.lat, dest.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestIdx = i;
            }
        }

        // Add the nearest stop to our path
        const nextStop = unvisited[nearestIdx];
        
        // Save the distance from the previous stop for the UI (converted to meters or km)
        nextStop.distanceFromPrevious = minDistance; 
        
        path.push(nextStop);
        
        // The new stop becomes our starting point for the next jump
        currentPoint = nextStop.location;
        unvisited.splice(nearestIdx, 1);
    }

    return path;
}
