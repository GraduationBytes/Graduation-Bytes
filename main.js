/* ==========================================================================
   1. QUOTE OF THE DAY (Automated Engine)
   ========================================================================== */
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
    const dayIndex = Math.floor(Date.now() / 86400000) % quotes.length;
    
    quoteElement.style.opacity = 0;
    setTimeout(() => {
        quoteElement.textContent = quotes[dayIndex];
        quoteElement.style.opacity = 1;
    }, 300);
}

/* ==========================================================================
   2. VAULT DATA MANAGEMENT (State & Initialization)
   ========================================================================== */
let vaultData = []; 

async function initializeApp() {
    displayDailyQuote();
    document.getElementById('current-year').textContent = new Date().getFullYear();

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Database file not found!");
        
        vaultData = await response.json();
        renderGrid(vaultData); // Boot directly into the Grid View
        populateSessionDropdown(vaultData);
        
    } catch (error) {
        console.error("System Error:", error);
        document.getElementById('lms-grid-container').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: red; padding: 2rem;">
                System Offline: Could not load data.json. Ensure the file exists and is formatted correctly.
            </div>`;
    }
}

/* ==========================================================================
   3. DATA STRUCTURING ENGINE (Flattens JSON into Hierarchies)
   ========================================================================== */
function groupDataForGrid(dataArray) {
    const grouped = {};
    dataArray.forEach(item => {
        const cat = item.Category || 'Core';
        const sub = item.Subject;
        const chap = item.Chapter;

        if (!grouped[cat]) grouped[cat] = {};
        if (!grouped[cat][sub]) grouped[cat][sub] = {};
        if (!grouped[cat][sub][chap]) grouped[cat][sub][chap] = [];

        grouped[cat][sub][chap].push(item);
    });
    return grouped;
}

/* ==========================================================================
   4. VIEW ROUTING: GRID VIEW (Subject Cards)
   ========================================================================== */
function renderGrid(dataToRender) {
    const gridContainer = document.getElementById('lms-grid-container');
    const chapterView = document.getElementById('chapter-view-container');
    const emptyState = document.getElementById('empty-state');

    // Ensure correct views are active
    chapterView.classList.add('hidden');
    gridContainer.innerHTML = '';

    if (dataToRender.length === 0) {
        gridContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    gridContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const groupedData = groupDataForGrid(dataToRender);

    // Build Cards
    for (const category in groupedData) {
        for (const subject in groupedData[category]) {
            // Count total resources available in this subject
            let totalResources = 0;
            for (const chap in groupedData[category][subject]) {
                totalResources += groupedData[category][subject][chap].length;
            }

            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div>
                    <span class="category-badge">${category}</span>
                    <h3>${subject}</h3>
                </div>
                <p><i class="fas fa-file-alt"></i> ${totalResources} Resources Available</p>
            `;

            // On Click: Route to Chapter View
            card.addEventListener('click', () => {
                renderChapterView(subject, groupedData[category][subject]);
            });

            gridContainer.appendChild(card);
        }
    }
}

/* ==========================================================================
   5. VIEW ROUTING: CHAPTER VIEW (Accordions)
   ========================================================================== */
function renderChapterView(subjectName, chaptersData) {
    const gridContainer = document.getElementById('lms-grid-container');
    const chapterView = document.getElementById('chapter-view-container');
    const accordionContainer = document.getElementById('accordion-container');
    const subjectTitle = document.getElementById('active-subject-title');

    // Switch Views
    gridContainer.classList.add('hidden');
    chapterView.classList.remove('hidden');
    subjectTitle.textContent = subjectName;
    accordionContainer.innerHTML = '';

    // THE FIX: Force the browser to scroll up to the top of the vault.
    // Subtracting 80px accounts for your sticky header so the title isn't hidden.
    const vaultPosition = document.getElementById('vault').offsetTop;
    window.scrollTo({ top: vaultPosition - 80, behavior: 'smooth' });

    // Sort chapters alphabetically/numerically based on the JSON string
    const sortedChapters = Object.keys(chaptersData).sort();

    sortedChapters.forEach(chapter => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'accordion-item';

        // Build Parts List HTML
        let partsHTML = '<div class="part-list">';
        chaptersData[chapter].forEach(part => {
            partsHTML += `
                <div class="part-item">
                    <span class="part-title">${part.Topic_Format}</span>
                    <a href="${part.Link}" target="_blank" class="resource-link-btn">
                        <i class="fas fa-external-link-alt"></i> Access
                    </a>
                </div>
            `;
        });
        partsHTML += '</div>';

        itemDiv.innerHTML = `
            <div class="accordion-header">
                <h4>${chapter}</h4>
                <i class="fas fa-chevron-down accordion-icon"></i>
            </div>
            <div class="accordion-body">
                ${partsHTML}
            </div>
        `;

        // Accordion Toggle Logic
        const header = itemDiv.querySelector('.accordion-header');
        const body = itemDiv.querySelector('.accordion-body');
        
        header.addEventListener('click', () => {
            const isActive = itemDiv.classList.contains('active');
            
            // Close all other accordions (Optional, remove this block to allow multiple open)
            document.querySelectorAll('.accordion-item').forEach(el => {
                el.classList.remove('active');
                el.querySelector('.accordion-body').style.maxHeight = null;
            });

            if (!isActive) {
                itemDiv.classList.add('active');
                body.style.maxHeight = body.scrollHeight + "px";
            }
        });

        accordionContainer.appendChild(itemDiv);
    });
}

/* ==========================================================================
   6. INTERACTIVE CONTROLS (Buttons, Search, Filters)
   ========================================================================== */

// Back Button Logic
document.getElementById('back-to-grid-btn').addEventListener('click', () => {
    applyFilters(); // Re-renders the grid based on current search/filter state
});

// Expand All Button Logic
document.getElementById('expand-all-btn').addEventListener('click', function() {
    const isExpanding = this.textContent === 'Expand All';
    this.textContent = isExpanding ? 'Collapse All' : 'Expand All';

    document.querySelectorAll('.accordion-item').forEach(item => {
        const body = item.querySelector('.accordion-body');
        if (isExpanding) {
            item.classList.add('active');
            body.style.maxHeight = body.scrollHeight + "px";
        } else {
            item.classList.remove('active');
            body.style.maxHeight = null;
        }
    });
});

// Dynamic Session Dropdown population
function populateSessionDropdown(data) {
    const sessionFilter = document.getElementById('session-filter');
    const uniqueSessions = [...new Set(data.map(item => item.Session))];
    
    sessionFilter.innerHTML = '<option value="all">All Sessions</option>';
    uniqueSessions.forEach(session => {
        if(session) {
            sessionFilter.innerHTML += `<option value="${session}">${session}</option>`;
        }
    });
}

// Global Filter Engine (Searches JSON and updates Grid)
function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const sessionQuery = document.getElementById('session-filter').value;

    const filteredResults = vaultData.filter(item => {
        const matchesSearch = 
            (item.Subject && item.Subject.toLowerCase().includes(searchQuery)) || 
            (item.Chapter && item.Chapter.toLowerCase().includes(searchQuery)) ||
            (item.Topic_Format && item.Topic_Format.toLowerCase().includes(searchQuery));
            
        const matchesSession = (sessionQuery === 'all') || (item.Session === sessionQuery);

        return matchesSearch && matchesSession;
    });

    renderGrid(filteredResults);
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('session-filter').addEventListener('change', applyFilters);

// Boot System
document.addEventListener('DOMContentLoaded', initializeApp);

/* ==========================================================================
   7. MOBILE UX: SEARCH FOCUS UPLIFT
   ========================================================================== */
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('focus', () => {
    if (window.innerWidth < 768) {
        setTimeout(() => {
            const vaultSection = document.getElementById('vault');
            const headerHeight = document.querySelector('.site-header').offsetHeight;
            const vaultPosition = vaultSection.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: vaultPosition - headerHeight - 10,
                behavior: 'smooth'
            });
        }, 300);
    }
});
