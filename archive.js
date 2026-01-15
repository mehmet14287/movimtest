
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('full-series-archive-container');
    const searchBar = document.getElementById('search-bar');
    let allSeries = []; // Store all series data to avoid re-fetching

    // Fetch all series data
    fetch(`series.json?v=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(seriesData => {
            allSeries = seriesData;
            if (allSeries && allSeries.length > 0) {
                renderFullSeries(allSeries);
            } else {
                container.innerHTML = '<p class="text-gray-400 text-center col-span-full">Arşivde hiç dizi bulunamadı.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching series data:', error);
            container.innerHTML = '<p class="text-red-400 text-center col-span-full">Dizi arşivi yüklenirken bir hata oluştu.</p>';
        });

    // Add event listener for the search bar
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSeries = allSeries.filter(series => 
            series.title.toLowerCase().includes(searchTerm)
        );
        renderFullSeries(filteredSeries, searchTerm);
    });

    // Function to render the series grid
    function renderFullSeries(seriesArray, searchTerm = '') {
        if (seriesArray.length === 0) {
            container.innerHTML = `<p class="text-gray-400 text-center col-span-full">Arama sonucuyla eşleşen dizi bulunamadı: "${searchTerm}"</p>`;
            return;
        }

        const seriesHTML = seriesArray.map(series => `
            <a href="dizi-detay.html?id=${series.id}" class="relative group series-card rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105" style="aspect-ratio: 2/3;">
                <img src="${series.posterUrl}" alt="${series.title} afişi" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4">
                    <h3 class="text-lg font-bold text-white">${series.title}</h3>
                </div>
            </a>
        `).join('');

        container.innerHTML = seriesHTML;
    }
});
