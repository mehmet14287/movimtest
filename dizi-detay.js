
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('detail-main-content');
    const recommendationsContainer = document.getElementById('recommendations-container');

    // 1. URL'den dizi ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    if (!seriesId) {
        displayError(mainContent, 'Dizi bulunamadı. Lütfen geçerli bir dizi seçin.');
        return;
    }

    // 2. Tüm dizileri ve ardından belirli diziyi getir
    fetchWithCacheBust('series.json')
        .then(allSeries => {
            const series = allSeries.find(s => s.id === seriesId);

            if (!series) {
                displayError(mainContent, 'Seçilen dizi arşivde bulunamadı.');
                return;
            }

            // 3. Dizi bilgilerini ve önerileri ekrana bas
            renderSeriesDetails(series, mainContent);
            renderRecommendations(allSeries.filter(s => s.id !== seriesId), recommendationsContainer);

            // Sayfa başlığını güncelle
            document.title = `${series.title} | Movim`;
        })
        .catch(error => {
            console.error('Error fetching series data:', error);
            displayError(mainContent, 'Dizi bilgileri yüklenirken bir hata oluştu.');
        });
});

/**
 * Önbelleği atlatmak için URL'ye zaman damgası ekleyerek JSON verisi çeker.
 * @param {string} url - Çekilecek JSON dosyasının yolu.
 * @returns {Promise<any>} - JSON verisini içeren bir Promise.
 */
function fetchWithCacheBust(url) {
    return fetch(`${url}?v=${new Date().getTime()}`)
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
            return response.json();
        });
}

/**
 * Dizi detaylarını HTML'e yerleştirir.
 * @param {object} series - Dizi objesi.
 * @param {HTMLElement} container - Detayların yerleştirileceği ana konteyner.
 */
function renderSeriesDetails(series, container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
            <!-- Sol Taraf: Poster -->
            <div class="md:col-span-1 rounded-xl overflow-hidden shadow-2xl shadow-black/50 mx-auto">
                <img src="${series.posterUrl}" alt="${series.title} afişi" class="w-full h-auto object-cover">
            </div>

            <!-- Sağ Taraf: Bilgiler -->
            <div class="md:col-span-2 flex flex-col gap-6">
                <h1 class="text-4xl md:text-6xl font-bold neon-text-header">${series.title}</h1>
                
                <div class="flex flex-wrap gap-3 items-center">
                    <span class="font-semibold text-gray-400">Tür:</span>
                    ${series.genre.split(', ').map(g => `<span class="bg-gray-800 text-teal-300 text-sm font-medium px-3 py-1 rounded-full">${g}</span>`).join('')}
                </div>

                <div>
                    <h2 class="text-2xl font-bold mb-3">Özet</h2>
                    <p class="text-gray-300 leading-relaxed">${series.summary}</p>
                </div>
                
                <div class="mt-4 flex flex-wrap gap-4">
                     <a href="#" class="btn-glow-primary bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                        <i class="fas fa-play"></i>
                        <span>Hemen İzle</span>
                    </a>
                    <a href="#" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105">
                        Listeme Ekle
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Rastgele dizi önerilerini HTML'e yerleştirir.
 * @param {Array<object>} otherSeries - Önerilecek diğer dizilerin listesi.
 * @param {HTMLElement} container - Önerilerin yerleştirileceği konteyner.
 */
function renderRecommendations(otherSeries, container) {
    // Dizileri karıştır ve ilk 6 tanesini al
    const recommendations = otherSeries.sort(() => 0.5 - Math.random()).slice(0, 6);

    if (recommendations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Gösterilecek başka dizi bulunamadı.</p>';
        return;
    }

    const recommendationsHTML = recommendations.map(series => `
        <a href="dizi-detay.html?id=${series.id}" class="series-card rounded-lg overflow-hidden group transform transition-transform duration-300 hover:-translate-y-2">
            <div style="aspect-ratio: 2/3;" class="relative">
                <img src="${series.posterUrl}" alt="${series.title} afişi" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <h3 class="absolute bottom-0 left-0 right-0 p-3 text-sm font-bold text-white">${series.title}</h3>
            </div>
        </a>
    `).join('');

    container.innerHTML = recommendationsHTML;
}

/**
 * Hata mesajını belirtilen konteynerde gösterir.
 * @param {HTMLElement} container - Mesajın gösterileceği element.
 * @param {string} message - Gösterilecek hata mesajı.
 */
function displayError(container, message) {
    container.innerHTML = `
        <div class="text-center py-20 text-red-400">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
            <p class="mt-4 text-lg">${message}</p>
            <a href="index.html" class="mt-6 inline-block bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600">Ana Sayfaya Dön</a>
        </div>
    `;
}
