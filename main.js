
document.addEventListener('DOMContentLoaded', () => {

    // --- DYNAMIC DATA FETCHING ---
    fetchWithCacheBust('config.json')
        .then(config => setupDynamicLinks(config))
        .catch(error => console.error('Error fetching config:', error));

    const marqueeContainer = document.getElementById('series-marquee-container');
    if (marqueeContainer) {
        fetchWithCacheBust('series.json')
            .then(seriesData => renderSeriesMarquee(marqueeContainer, seriesData))
            .catch(error => {
                console.error('Error fetching series data:', error);
                marqueeContainer.innerHTML = '<p class="text-red-400 text-center w-full">Öne çıkanlar yüklenirken bir hata oluştu.</p>';
            });
    }

    const faqContainer = document.getElementById('faq-container');
    if (faqContainer) {
        fetchWithCacheBust('faq.json')
            .then(faqData => renderFaq(faqContainer, faqData))
            .catch(error => {
                console.error('Error fetching FAQ data:', error);
                faqContainer.innerHTML = '<p class="text-red-400 text-center">SSS yüklenirken bir hata oluştu.</p>';
            });
    }

    // --- RENDERING FUNCTIONS ---

    function renderSeriesMarquee(container, seriesArray) {
        if (!seriesArray || seriesArray.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center w-full">Henüz arşivde dizi bulunmuyor.</p>';
            return;
        }

        const marqueeSeries = seriesArray.length > 10 ? seriesArray.slice(0, 10) : seriesArray;

        const seriesHTML = marqueeSeries.map(series => `
            <a href="dizi-detay.html?id=${series.id}" class="flex-shrink-0 w-48 md:w-56 lg:w-64 group series-card rounded-lg overflow-hidden" style="aspect-ratio: 2/3;">
                <img src="${series.posterUrl}" alt="${series.title} afişi" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-4">
                    <h3 class="text-lg font-bold text-white">${series.title}</h3>
                </div>
            </a>
        `).join('');

        container.innerHTML = seriesHTML;

        requestAnimationFrame(() => {
            const contentWidth = container.scrollWidth;
            const speed = 50; // pixels per second
            const duration = contentWidth / speed;
            container.style.setProperty('--marquee-duration', `${duration}s`);
            container.innerHTML += seriesHTML; // Duplicate content for seamless loop
            container.classList.add('animate-marquee');
        });
    }

    function renderFaq(container, faqArray) {
        if (!faqArray || faqArray.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center">Sıkça sorulan soru bulunmuyor.</p>';
            return;
        }
        const faqHTML = faqArray.map(item => `
            <details class="glassmorphism rounded-lg p-5 cursor-pointer">
                <summary class="font-semibold text-lg flex justify-between items-center">
                    ${item.question}
                    <span class="transform transition-transform duration-300"><i class="fas fa-chevron-down"></i></span>
                </summary>
                <p class="mt-4 text-gray-400">${item.answer}</p>
            </details>
        `).join('');
        container.innerHTML = faqHTML;
        initializeAccordion();
    }

    // --- UTILITY AND SETUP FUNCTIONS ---

    function fetchWithCacheBust(url) {
        return fetch(`${url}?v=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
                return response.json();
            });
    }

    function setupDynamicLinks(config) {
        document.getElementById('latest-version-btn').href = config.download.latestVersion;
        document.getElementById('google-drive-btn').href = config.download.googleDrive;
        const whatsappBaseUrl = `https://wa.me/${config.contact.whatsapp.number}`;
        const iosWhatsappUrl = `${whatsappBaseUrl}?text=${encodeURIComponent(config.contact.whatsapp.iosMessage)}`;
        document.getElementById('ios-btn').href = iosWhatsappUrl;
        document.getElementById('whatsapp-fab').href = whatsappBaseUrl;
        document.getElementById('telegram-btn').href = config.contact.telegram;
    }

    function initializeAccordion() {
        const details = document.querySelectorAll("#faq-container details");
        details.forEach((detail) => {
            detail.addEventListener("toggle", () => {
                const icon = detail.querySelector('i');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            });
        });
    }
});
