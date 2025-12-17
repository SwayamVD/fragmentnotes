class FragmentNotes {
  constructor() {
    this.notes = [];
    this.filteredNotes = [];
    this.isSearchActive = false;
    
    this.initElements();
    this.initEventListeners();
    this.loadData();
    this.render();
  }

  initElements() {
    this.elements = {
      notesContainer: document.getElementById('notesContainer'),
      newNoteBtn: document.getElementById('newNoteBtn'),
      firstNoteBtn: document.getElementById('firstNoteBtn'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      searchBtn: document.getElementById('searchBtn'),
      searchBar: document.getElementById('searchBar'),
      searchInput: document.getElementById('searchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      emptyState: document.getElementById('emptyState'),
      statusText: document.getElementById('statusText'),
      noteCount: document.getElementById('noteCount')
    };
  }

  initEventListeners() {
    // Note creation
    this.elements.newNoteBtn.addEventListener('click', () => this.createNote());
    this.elements.firstNoteBtn.addEventListener('click', () => this.createNote());
    
    // Theme toggle
    this.elements.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    
    // Search functionality
    this.elements.searchBtn.addEventListener('click', () => this.toggleSearch());
    this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    this.elements.clearSearchBtn.addEventListener('click', () => this.clearSearch());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Search bar escape
    this.elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.toggleSearch();
    });
  }

  loadData() {
    // Load theme
    const savedTheme = localStorage.getItem('fragmentNotesTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Load notes
    const savedNotes = localStorage.getItem('fragmentNotes');
    if (savedNotes) {
      try {
        this.notes = JSON.parse(savedNotes);
        this.validateNotes();
      } catch (e) {
        console.error('Error loading notes:', e);
        this.notes = [];
      }
    }
    
    this.filteredNotes = [...this.notes];
  }

  validateNotes() {
    this.notes = this.notes.map(note => ({
      id: note.id || Date.now().toString(),
      title: note.title || 'Untitled',
      content: note.content || '',
      date: note.date || new Date().toISOString(),
      lastModified: note.lastModified || Date.now(),
      wordCount: this.getWordCount(note.content || '')
    }));
  }

  saveData() {
    localStorage.setItem('fragmentNotes', JSON.stringify(this.notes));
  }

  createNote(title = 'New Note', content = '') {
    const note = {
      id: Date.now().toString(),
      title,
      content,
      date: new Date().toISOString(),
      lastModified: Date.now(),
      wordCount: this.getWordCount(content)
    };

    this.notes.unshift(note);
    this.saveData();
    this.updateFilteredNotes();
    this.render();
    
    // Focus new note
    setTimeout(() => {
      const noteElement = document.getElementById(note.id);
      if (noteElement) {
        const titleInput = noteElement.querySelector('.note-title-input');
        titleInput?.focus();
        titleInput?.select();
      }
    }, 100);

    this.showStatus('Note created');
    return note;
  }

  deleteNote(id) {
    if (confirm('Delete this note?')) {
      this.notes = this.notes.filter(note => note.id !== id);
      this.saveData();
      this.updateFilteredNotes();
      this.render();
      this.showStatus('Note deleted');
    }
  }

  updateNote(id, updates) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      Object.assign(note, updates, {
        lastModified: Date.now(),
        wordCount: this.getWordCount(updates.content || note.content)
      });
      this.saveData();
      this.updateFilteredNotes();
      this.updateNoteCount();
    }
  }

  getWordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('fragmentNotesTheme', newTheme);
    
    this.showStatus(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme enabled`);
  }

  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
    
    if (this.isSearchActive) {
      this.elements.searchBar.classList.add('active');
      this.elements.searchInput.focus();
    } else {
      this.elements.searchBar.classList.remove('active');
      this.clearSearch();
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.clearSearch();
      return;
    }

    const searchTerm = query.toLowerCase();
    this.filteredNotes = this.notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
    
    this.render();
    this.showStatus(`Found ${this.filteredNotes.length} note(s)`);
  }

  clearSearch() {
    this.elements.searchInput.value = '';
    this.filteredNotes = [...this.notes];
    this.render();
  }

  updateFilteredNotes() {
    if (this.isSearchActive && this.elements.searchInput.value.trim()) {
      this.handleSearch(this.elements.searchInput.value);
    } else {
      this.filteredNotes = [...this.notes];
    }
  }

  handleKeyboard(e) {
    // Ctrl/Cmd + N: New note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.createNote();
    }
    
    // Ctrl/Cmd + F: Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      this.toggleSearch();
    }
  }

  render() {
    this.elements.notesContainer.innerHTML = '';
    
    if (this.filteredNotes.length === 0) {
      if (this.notes.length === 0) {
        this.renderEmptyState();
      } else {
        this.renderNoResults();
      }
      return;
    }

    // Sort by last modified
    const sortedNotes = [...this.filteredNotes].sort((a, b) => b.lastModified - a.lastModified);
    
    sortedNotes.forEach(note => this.renderNote(note));
    this.updateNoteCount();
  }

  renderEmptyState() {
    this.elements.emptyState.style.display = 'block';
    this.elements.notesContainer.appendChild(this.elements.emptyState);
    this.updateNoteCount();
  }

  renderNoResults() {
    const noResults = document.createElement('div');
    noResults.className = 'empty-state';
    noResults.innerHTML = `
      <div class="empty-icon">🔍</div>
      <h2>No results found</h2>
      <p>Try adjusting your search terms</p>
    `;
    this.elements.notesContainer.appendChild(noResults);
  }

  renderNote(note) {
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.id = note.id;
    
    // Highlight search terms
    const searchTerm = this.elements.searchInput.value.toLowerCase();
    const shouldHighlight = searchTerm && (
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
    
    if (shouldHighlight) {
      noteElement.classList.add('highlighted');
    }

    noteElement.innerHTML = `
      <div class="note-header">
        <input type="text" class="note-title-input" value="${this.escapeHtml(note.title)}" placeholder="Note title">
        <div class="note-actions">
          <button class="delete-btn" title="Delete note">×</button>
        </div>
      </div>
      <div class="note-content">
        <textarea class="note-textarea" placeholder="Start writing...">${this.escapeHtml(note.content)}</textarea>
      </div>
      <div class="note-footer">
        <div class="note-date">${this.formatDate(note.date)}</div>
        <div class="word-count">${note.wordCount} words</div>
      </div>
    `;

    this.attachNoteListeners(noteElement, note);
    this.elements.notesContainer.appendChild(noteElement);
  }

  attachNoteListeners(noteElement, note) {
    const deleteBtn = noteElement.querySelector('.delete-btn');
    const titleInput = noteElement.querySelector('.note-title-input');
    const textarea = noteElement.querySelector('.note-textarea');

    deleteBtn.addEventListener('click', () => this.deleteNote(note.id));

    // Debounced save for title
    let titleTimeout;
    titleInput.addEventListener('input', () => {
      clearTimeout(titleTimeout);
      titleTimeout = setTimeout(() => {
        this.updateNote(note.id, { title: titleInput.value || 'Untitled' });
      }, 500);
    });

    // Debounced save for content
    let contentTimeout;
    textarea.addEventListener('input', () => {
      clearTimeout(contentTimeout);
      contentTimeout = setTimeout(() => {
        this.updateNote(note.id, { content: textarea.value });
        // Update word count in real-time
        const wordCountEl = noteElement.querySelector('.word-count');
        const wordCount = this.getWordCount(textarea.value);
        wordCountEl.textContent = `${wordCount} words`;
      }, 300);
    });

    // Auto-resize textarea
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  updateNoteCount() {
    const count = this.notes.length;
    this.elements.noteCount.textContent = `${count} note${count !== 1 ? 's' : ''}`;
  }

  showStatus(message) {
    this.elements.statusText.textContent = message;
    setTimeout(() => {
      this.elements.statusText.textContent = 'Ready';
    }, 2000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new FragmentNotes();
});