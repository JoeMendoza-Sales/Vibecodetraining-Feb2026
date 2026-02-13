/**
 * @jest-environment jsdom
 */

describe('Todo App - Delete Confirmation Modal', () => {
  const STORAGE_KEY = 'todos';

  // Helper functions extracted from index.html (exact copy)
  function loadTodos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  function saveTodos(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year.slice(-2)}`;
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr + 'T00:00:00') < today;
  }

  function render() {
    const todos = loadTodos();
    const list = document.getElementById('todoList');

    if (todos.length === 0) {
      list.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
      return;
    }

    list.innerHTML = todos.map(todo => {
      const overdue = !todo.completed && isOverdue(todo.dueDate);
      return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
          <div class="todo-content">
            <div class="todo-text">${escapeHtml(todo.text)}</div>
            ${todo.dueDate ? `<div class="todo-due ${overdue ? 'overdue' : ''}">Due: ${formatDate(todo.dueDate)}${overdue ? ' (overdue)' : ''}</div>` : ''}
          </div>
          <div class="todo-actions">
            <button class="btn-icon" title="Edit">&#9998;</button>
            <button class="btn-icon delete" title="Delete">&#10005;</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Exact copy from index.html
  function showConfirm(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn-yes">Yes</button>
          <button class="btn-no">No</button>
        </div>
      </div>
    `;

    overlay.querySelector('.btn-yes').onclick = () => {
      document.body.removeChild(overlay);
      callback(true);
    };

    overlay.querySelector('.btn-no').onclick = () => {
      document.body.removeChild(overlay);
      callback(false);
    };

    document.body.appendChild(overlay);
  }

  // Exact copy from index.html
  function deleteTodo(id) {
    showConfirm('Are you sure?', function(confirmed) {
      const todos = loadTodos().filter(t => t.id !== id);
      saveTodos(todos);
      render();
    });
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Set up minimal DOM
    document.body.innerHTML = `
      <div class="app">
        <div class="todo-list" id="todoList"></div>
      </div>
    `;
  });

  afterEach(() => {
    // Clean up any modals left over
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.remove();
    }
  });

  test('clicking "No" on delete confirmation modal should NOT delete the todo', () => {
    // Arrange: Create a todo item
    const testTodo = {
      id: 'test123',
      text: 'Test todo item',
      dueDate: '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    saveTodos([testTodo]);
    render();

    // Verify todo exists before deletion attempt
    expect(loadTodos()).toHaveLength(1);
    expect(loadTodos()[0].text).toBe('Test todo item');

    // Act: Trigger delete which shows the confirmation modal
    deleteTodo('test123');

    // Verify modal is displayed
    const modal = document.querySelector('.modal-overlay');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('p').textContent).toBe('Are you sure?');

    // Click "No" button to cancel deletion
    const noButton = modal.querySelector('.btn-no');
    noButton.click();

    // Assert: Modal should be closed
    expect(document.querySelector('.modal-overlay')).toBeNull();

    // Assert: Todo should still exist (not deleted)
    const todosAfter = loadTodos();
    expect(todosAfter).toHaveLength(1);
    expect(todosAfter[0].id).toBe('test123');
    expect(todosAfter[0].text).toBe('Test todo item');
  });
});
