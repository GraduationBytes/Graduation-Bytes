/* ==========================================================================
   1. QUOTE OF THE DAY (Automated Engine)
   ========================================================================== */
// I have provided 10 high-quality finance/study quotes. You can add up to 30.
const quotes = [
    "“An investment in knowledge pays the best interest.” – Benjamin Franklin",
    "“Do not save what is left after spending, but spend what is left after saving.” – Warren Buffett",
    "“The harder you work for something, the greater you'll feel when you achieve it.”",
    "“Success is the sum of small efforts, repeated day-in and day-out.” – Robert Collier",
    "“Accounting is the language of business.” – Warren Buffett",
    "“There are no secrets to success. It is the result of preparation, hard work, and learning from failure.” – Colin Powell",
    "“Formal education will make you a living; self-education will make you a fortune.” – Jim Rohn",
    "“Price is what you pay. Value is what you get.” – Warren Buffett",
    "“Don't watch the clock; do what it does. Keep going.” – Sam Levenson",
    "“The only place where success comes before work is in the dictionary.” – Vidal Sassoon"
];

function displayDailyQuote() {
    const quoteElement = document.getElementById('daily-quote');
    
    // Calculates the days since the UNIX epoch to ensure the quote changes exactly at midnight
    const dayIndex = Math.floor(Date.now() / 86400000) % quotes.length;
    
    // Fade effect logic
    quoteElement.style.opacity = 0;
    setTimeout(() => {
        quoteElement.textContent = quotes[dayIndex];
        quoteElement.style.opacity = 1;
    }, 300); // Wait 0.3s for the text to change, then fade it back in
}

/* ==========================================================================
   2. VAULT DATA MANAGEMENT (The Brain)
   ========================================================================== */
let vaultData = []; // This will hold all 15 years of your data in memory

async function initializeApp() {
    // 1. Set the Quote
    displayDailyQuote();
    
    // 2. Set the dynamic Footer Year
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // 3. Fetch the Database (data.json)
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Database file not found!");
        
        vaultData = await response.json();
        
        // Initial Load: Show the "Latest 10" feed automatically
        renderTable(vaultData.slice(0, 3));
        
    } catch (error) {
        console.error("System Error:", error);
        document.getElementById('data-table-body').innerHTML = `
            <tr><td colspan="4" style="text-align:center; color:red;">
                System Offline: Could not load data.json. Ensure the file exists.
            </td></tr>`;
    }
}

/* ==========================================================================
   3. RENDERING LOGIC (Building the HTML on the fly)
   ========================================================================== */
function renderTable(dataToRender) {
    const tableBody = document.getElementById('data-table-body');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-container');

    // Clear the current table
    tableBody.innerHTML = '';

    // Logic Gate: If no data matches the search, show "Coming Soon"
    if (dataToRender.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    // Otherwise, show the table
    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Loop through the data and build rows
    dataToRender.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><span style="font-weight: 600; color: #475569;">${item.Session}</span></td>
            <td>
                <strong style="color: var(--primary-color);">${item.Subject}</strong><br>
                <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">${item.Category || 'Core'}</span>
            </td>
            <td>
                ${item.Chapter}<br>
                <span style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600;">${item.Topic_Format}</span>
            </td>
            <td>
                <a href="${item.Link}" target="_blank" class="resource-link-btn">
                    <i class="fas fa-external-link-alt"></i> Access Resource
                </a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/* ==========================================================================
   4. SEARCH & FILTER ENGINE
   ========================================================================== */
function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const sessionQuery = document.getElementById('session-filter').value;

    // If inputs are empty, revert to the "Latest 10" feed
    if (searchQuery === '' && sessionQuery === 'all') {
        renderTable(vaultData.slice(0, 10));
        return;
    }

    // Filter the master list
    const filteredResults = vaultData.filter(item => {
        // Check if the search text is inside the Subject, Chapter, or Topic
        const matchesSearch = item.Subject.toLowerCase().includes(searchQuery) || 
                              item.Chapter.toLowerCase().includes(searchQuery) ||
                              item.Topic_Format.toLowerCase().includes(searchQuery);
                              
        // Check if the Session matches the dropdown
        const matchesSession = (sessionQuery === 'all') || (item.Session === sessionQuery);

        return matchesSearch && matchesSession;
    });

    // Render the new filtered list
    renderTable(filteredResults);
}

// Attach event listeners to the search bar and dropdown
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('session-filter').addEventListener('change', applyFilters);

// Boot up the app when the HTML finishes loading
document.addEventListener('DOMContentLoaded', initializeApp);
