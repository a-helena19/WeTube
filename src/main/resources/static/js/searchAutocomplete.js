
(function() {
    'use strict';

    let debounceTimer = null;
    let currentSuggestions = [];
    let selectedIndex = -1;

    function init() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;

        const dropdown = createDropdown(searchInput);

        searchInput.addEventListener('input', (e) => handleInput(e, dropdown));
        searchInput.addEventListener('keydown', (e) => handleKeydown(e, dropdown, searchInput));
        searchInput.addEventListener('focus', () => {
            if (currentSuggestions.length > 0) {
                dropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar')) {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
    }

    function createDropdown(searchInput) {
        const searchBar = searchInput.closest('.search-bar');

        let dropdown = searchBar.querySelector('.search-suggestions');
        if (dropdown) return dropdown;

        dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1a1a1a;
            border: 1px solid #333;
            border-top: none;
            border-radius: 0 0 20px 20px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1001;
            display: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            width: 650px;
        `;

        searchBar.style.position = 'relative';
        searchBar.appendChild(dropdown);

        return dropdown;
    }

    function handleInput(e, dropdown) {
        const query = e.target.value.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (query.length < 1) {
            dropdown.style.display = 'none';
            currentSuggestions = [];
            selectedIndex = -1;
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchSuggestions(query, dropdown);
        }, 300);
    }

    async function fetchSuggestions(query, dropdown) {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const suggestions = await response.json();
            currentSuggestions = suggestions;
            selectedIndex = -1;
            renderSuggestions(suggestions, dropdown, query);
        } catch (error) {
            dropdown.style.display = 'none';
        }
    }

    function renderSuggestions(suggestions, dropdown, query) {
        if (suggestions.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.innerHTML = suggestions.map((suggestion, index) => {
            const highlighted = highlightMatch(suggestion, query);
            return `
                <div class="suggestion-item" data-index="${index}" style="
                    padding: 10px 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 1px solid #333;
                    transition: background-color 0.15s ease;
                    font-size: 12px;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 16px; height: 16px;">
                        <path fill="#888" d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/>
                    </svg>
                    <span style="color: #fff;">${highlighted}</span>
                </div>
            `;
        }).join('');

        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                clearSelection(dropdown);
                item.style.backgroundColor = '#333';
                selectedIndex = parseInt(item.dataset.index);
            });
            item.addEventListener('mouseleave', () => {
                if (selectedIndex !== parseInt(item.dataset.index)) {
                    item.style.backgroundColor = 'transparent';
                }
            });
            item.addEventListener('click', () => {
                selectSuggestion(currentSuggestions[item.dataset.index]);
            });
        });

        dropdown.style.display = 'block';
    }

    function highlightMatch(text, query) {
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<strong style="color: #ff4444;">$1</strong>');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function handleKeydown(e, dropdown, searchInput) {
        const items = dropdown.querySelectorAll('.suggestion-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentSuggestions.length > 0) {
                    selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                    updateSelection(dropdown);
                    dropdown.style.display = 'block';
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (currentSuggestions.length > 0) {
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    updateSelection(dropdown);
                }
                break;

            case 'Enter':
                if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
                    e.preventDefault();
                    selectSuggestion(currentSuggestions[selectedIndex]);
                }
                break;

            case 'Escape':
                dropdown.style.display = 'none';
                selectedIndex = -1;
                break;
        }
    }

    function updateSelection(dropdown) {
        clearSelection(dropdown);

        if (selectedIndex >= 0) {
            const items = dropdown.querySelectorAll('.suggestion-item');
            if (items[selectedIndex]) {
                items[selectedIndex].style.backgroundColor = '#333';
                items[selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function clearSelection(dropdown) {
        dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.style.backgroundColor = 'transparent';
        });
    }

    function selectSuggestion(suggestion) {
        const searchInput = document.querySelector('.search-input');
        const dropdown = document.querySelector('.search-suggestions');

        searchInput.value = suggestion;
        dropdown.style.display = 'none';
        selectedIndex = -1;

        window.location.href = `/home?search=${encodeURIComponent(suggestion)}`;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

