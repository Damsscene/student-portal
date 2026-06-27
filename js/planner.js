/* ==========================================================================
   ACADEMIC PLANNER & SCHEDULER LOGIC (LOCALSTORAGE PERSISTED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPlanner();
  initCalendar();
});

/* ==========================================================================
   1. TASK CHECKLIST & FOCUS TIMER LOGIC
   ========================================================================== */
function initPlanner() {
  const addTaskForm = document.getElementById('add-task-form');
  const pendingList = document.getElementById('pending-tasks-list');
  const completedList = document.getElementById('completed-tasks-list');
  const pendingCount = document.getElementById('pending-count');
  const completedCount = document.getElementById('completed-count');
  const alertAudio = document.getElementById('timer-alert-audio');

  let tasks = [];
  try {
    const stored = localStorage.getItem('academic-tasks');
    tasks = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(tasks)) tasks = [];
  } catch (e) {
    console.error('Error loading tasks:', e);
    tasks = [];
  }

  // Reset active timers from previous session on refresh
  tasks = tasks.map(task => {
    if (!task) return null;
    return {
      ...task,
      timerRunning: false,
      intervalId: null
    };
  }).filter(Boolean);

  function saveTasks() {
    // Save only clean data without active interval IDs
    const cleanTasks = tasks.map(t => {
      if (!t) return null;
      const { intervalId, ...rest } = t;
      return rest;
    }).filter(Boolean);
    localStorage.setItem('academic-tasks', JSON.stringify(cleanTasks));
  }

  function renderTasks() {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';
    
    let pendingNum = 0;
    let completedNum = 0;

    tasks.forEach(task => {
      if (task.completed) {
        completedNum++;
        completedList.appendChild(createCompletedTaskHTML(task));
      } else {
        pendingNum++;
        pendingList.appendChild(createPendingTaskHTML(task));
      }
    });

    pendingCount.innerText = pendingNum;
    completedCount.innerText = completedNum;
  }

  function createPendingTaskHTML(task) {
    const card = document.createElement('div');
    card.className = `task-card`;
    card.setAttribute('data-id', task.id);

    const m = Math.floor(task.remainingSeconds / 60);
    const s = Math.floor(task.remainingSeconds % 60).toString().padStart(2, '0');

    // SVG dashoffset calculation: dasharray is 63. offset = 63 * (1 - fraction)
    const ratio = task.remainingSeconds / (task.durationMinutes * 60);
    const dashoffset = 63 * (1 - ratio);

    card.innerHTML = `
      <div class="task-card-header">
        <div>
          <h4 class="task-card-title">${escapeHTML(task.title)}</h4>
          <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight:500;">${escapeHTML(task.course)}</span>
        </div>
        <span class="task-priority-badge priority-${task.priority}">${task.priority}</span>
      </div>
      
      <div class="task-meta">
        <!-- Timer Widget -->
        <div class="task-timer-container">
          <svg class="timer-svg">
            <circle class="timer-circle-bg" cx="12" cy="12" r="10" />
            <circle class="timer-circle-progress" cx="12" cy="12" r="10" 
                    style="stroke-dashoffset: ${dashoffset};" />
          </svg>
          <span class="timer-display" style="font-size: 0.9rem; font-weight:600;">${m}:${s}</span>
          
          <button class="task-action-btn timer-toggle-btn" title="Start/Pause">
            ${task.timerRunning ? '⏸' : '▶'}
          </button>
          <button class="task-action-btn timer-reset-btn" title="Reset">🔄</button>
        </div>
      </div>

      <div class="task-actions">
        <button class="task-action-btn btn-complete">✓ Complete</button>
        <button class="task-action-btn btn-delete">🗑 Delete</button>
      </div>
    `;

    // Complete Button
    card.querySelector('.btn-complete').addEventListener('click', () => {
      toggleTaskCompletion(task.id);
    });

    // Delete Button
    card.querySelector('.btn-delete').addEventListener('click', () => {
      deleteTask(task.id);
    });

    // Timer Play/Pause Button
    card.querySelector('.timer-toggle-btn').addEventListener('click', () => {
      toggleTaskTimer(task.id);
    });

    // Timer Reset Button
    card.querySelector('.timer-reset-btn').addEventListener('click', () => {
      resetTaskTimer(task.id);
    });

    return card;
  }

  function createCompletedTaskHTML(task) {
    const card = document.createElement('div');
    card.className = `task-card`;
    card.style.opacity = '0.7';
    card.setAttribute('data-id', task.id);

    card.innerHTML = `
      <div class="task-card-header">
        <div>
          <h4 class="task-card-title" style="text-decoration: line-through;">${escapeHTML(task.title)}</h4>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHTML(task.course)}</span>
        </div>
        <span class="task-priority-badge priority-low" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color);">Done</span>
      </div>
      <div class="task-actions">
        <button class="task-action-btn btn-complete" style="color: var(--text-secondary);">↺ Reopen</button>
        <button class="task-action-btn btn-delete">🗑 Delete</button>
      </div>
    `;

    card.querySelector('.btn-complete').addEventListener('click', () => {
      toggleTaskCompletion(task.id);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      deleteTask(task.id);
    });

    return card;
  }

  // Adding Task
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const courseInput = document.getElementById('task-course');
    const priorityInput = document.getElementById('task-priority');
    const durationInput = document.getElementById('task-duration');

    const duration = parseInt(durationInput.value) || 25;
    const newTask = {
      id: Date.now().toString(),
      title: titleInput.value.trim(),
      course: courseInput.value.trim().toUpperCase(),
      priority: priorityInput.value,
      durationMinutes: duration,
      remainingSeconds: duration * 60,
      completed: false,
      timerRunning: false,
      intervalId: null
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    titleInput.value = '';
    courseInput.value = '';
    priorityInput.value = 'medium';
    durationInput.value = '25';
  });

  // Toggle Completed Status
  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.timerRunning) {
        clearInterval(task.intervalId);
        task.timerRunning = false;
        task.intervalId = null;
      }
      task.completed = !task.completed;
      // Reset timer if reopened
      if (!task.completed) {
        task.remainingSeconds = task.durationMinutes * 60;
      }
      saveTasks();
      renderTasks();
    }
  }

  // Delete Task
  function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
      const task = tasks[taskIndex];
      if (task.timerRunning) {
        clearInterval(task.intervalId);
      }
      
      // Animate card removal
      const card = document.querySelector(`.task-card[data-id="${id}"]`);
      if (card) {
        card.style.transform = 'scale(0.9) translateY(-10px)';
        card.style.opacity = '0';
        setTimeout(() => {
          tasks.splice(taskIndex, 1);
          saveTasks();
          renderTasks();
        }, 300);
      } else {
        tasks.splice(taskIndex, 1);
        saveTasks();
        renderTasks();
      }
    }
  }

  // Timer Toggle (Play/Pause)
  function toggleTaskTimer(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.timerRunning) {
      // Pause
      clearInterval(task.intervalId);
      task.timerRunning = false;
      task.intervalId = null;
      renderTasks();
      saveTasks();
    } else {
      // Pause other running timers first for focus!
      tasks.forEach(t => {
        if (t.timerRunning && t.id !== id) {
          clearInterval(t.intervalId);
          t.timerRunning = false;
          t.intervalId = null;
        }
      });

      // Play
      task.timerRunning = true;
      task.intervalId = setInterval(() => {
        if (task.remainingSeconds > 0) {
          task.remainingSeconds--;
          updateTimerUI(task);
          saveTasks();
        } else {
          // Timer finished
          clearInterval(task.intervalId);
          task.timerRunning = false;
          task.intervalId = null;
          
          // Play Alert sound
          if (alertAudio) {
            alertAudio.play().catch(e => console.log('Audio playback delayed:', e));
          }
          
          alert(`⏱ Timer completed for focus session: "${task.title}"! Excellent job.`);
          task.completed = true;
          saveTasks();
          renderTasks();
        }
      }, 1000);
      
      renderTasks();
    }
  }

  // Update specific timer card elements dynamically to prevent full list re-renders and flicker
  function updateTimerUI(task) {
    const card = document.querySelector(`.task-card[data-id="${task.id}"]`);
    if (card) {
      const display = card.querySelector('.timer-display');
      const progressCircle = card.querySelector('.timer-circle-progress');
      
      const m = Math.floor(task.remainingSeconds / 60);
      const s = Math.floor(task.remainingSeconds % 60).toString().padStart(2, '0');
      
      if (display) display.innerText = `${m}:${s}`;
      
      if (progressCircle) {
        const ratio = task.remainingSeconds / (task.durationMinutes * 60);
        const dashoffset = 63 * (1 - ratio);
        progressCircle.style.strokeDashoffset = dashoffset;
      }
    }
  }

  // Reset Timer
  function resetTaskTimer(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.timerRunning) {
        clearInterval(task.intervalId);
        task.timerRunning = false;
        task.intervalId = null;
      }
      task.remainingSeconds = task.durationMinutes * 60;
      saveTasks();
      renderTasks();
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  renderTasks();
}

/* ==========================================================================
   2. ACADEMIC SCHEDULER & MONTHLY CALENDAR
   ========================================================================== */
function initCalendar() {
  const monthSelect = document.getElementById('calendar-month-select');
  const yearSelect = document.getElementById('calendar-year-select');
  const daysGrid = document.getElementById('calendar-days-grid');
  const prevBtn = document.getElementById('calendar-prev-month');
  const nextBtn = document.getElementById('calendar-next-month');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Populate Month select
  monthNames.forEach((m, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.innerText = m;
    monthSelect.appendChild(opt);
  });

  // Populate Year select (2020 - 2035)
  for (let y = 2020; y <= 2035; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.innerText = y;
    yearSelect.appendChild(opt);
  }

  // Modal elements
  const modalOverlay = document.getElementById('scheduler-modal-overlay');
  const modalCloseBtn = document.getElementById('btn-close-modal');
  const modalForm = document.getElementById('scheduler-event-form');
  const modalDateTitle = document.getElementById('modal-title-date');
  const eventDateStrInput = document.getElementById('event-date-str');
  const eventTitleInput = document.getElementById('event-title');
  const eventTypeInput = document.getElementById('event-type');
  const customTypeGroup = document.getElementById('custom-type-group');
  const customLabelInput = document.getElementById('event-custom-label');
  const deleteBtn = document.getElementById('btn-delete-events-day');

  // Show/hide custom label input based on selected event type
  eventTypeInput.addEventListener('change', () => {
    if (eventTypeInput.value === 'custom') {
      customTypeGroup.style.display = 'block';
      customLabelInput.required = true;
    } else {
      customTypeGroup.style.display = 'none';
      customLabelInput.required = false;
      customLabelInput.value = '';
    }
  });

  // Calendar State (Defaults to June 2026 for student planner mockups)
  let currentDate = new Date(2026, 5, 21); // June 21, 2026

  let scheduledEvents = {
    '2026-06-15': [{ title: 'AWS Cloud Exam', type: 'exam' }],
    '2026-06-25': [{ title: 'Study Planner UI Prototype', type: 'project' }],
    '2026-06-30': [{ title: 'COS 106 Project Submission', type: 'project' }]
  };
  try {
    const stored = localStorage.getItem('academic-schedules');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        scheduledEvents = parsed;
      }
    }
  } catch (e) {
    console.error('Error loading schedules:', e);
  }

  function saveEvents() {
    localStorage.setItem('academic-schedules', JSON.stringify(scheduledEvents));
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Sync select dropdowns
    monthSelect.value = month;
    yearSelect.value = year;

    // Clear previous cells (keeping headers)
    const headers = daysGrid.querySelectorAll('.calendar-day-header');
    daysGrid.innerHTML = '';
    headers.forEach(h => daysGrid.appendChild(h));

    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const prevTotalDays = new Date(year, month, 0).getDate();

    // 1. Draw previous month filler days
    for (let i = firstDayIndex; i > 0; i--) {
      const day = prevTotalDays - i + 1;
      const cell = createDayCell(day, true, new Date(year, month - 1, day));
      daysGrid.appendChild(cell);
    }

    // 2. Draw current month days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const isToday = (day === 21 && month === 5 && year === 2026); // Match our mock today date June 21, 2026
      const cell = createDayCell(day, false, new Date(year, month, day), isToday);
      daysGrid.appendChild(cell);
    }

    // 3. Draw next month filler days to complete grid rows
    const totalCells = daysGrid.children.length - 7; // subtract header cells
    const remainingFiller = 42 - totalCells; // 6 rows * 7 columns = 42 cells
    for (let day = 1; day <= remainingFiller; day++) {
      const cell = createDayCell(day, true, new Date(year, month + 1, day));
      daysGrid.appendChild(cell);
    }
  }

  function createDayCell(dayNum, isOtherMonth, dateObj, isToday = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');

    cell.innerHTML = `<span class="day-number">${dayNum}</span>`;

    // Event Indicators container
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'calendar-events-container';
    cell.appendChild(eventsContainer);

    // Load Events for this day
    const dateKey = formatDateKey(dateObj);
    const dayEvents = scheduledEvents[dateKey];
    if (dayEvents && dayEvents.length > 0) {
      dayEvents.forEach(evt => {
        const dot = document.createElement('div');
        dot.className = 'calendar-event-dot';
        // Known types use CSS class; custom types get an inline orange color
        if (['exam', 'cert', 'project'].includes(evt.type)) {
          dot.classList.add(`event-${evt.type}`);
        } else {
          dot.style.background = '#f97316'; // orange for all custom types
        }
        dot.title = evt.customLabel ? `${evt.customLabel}: ${evt.title}` : evt.title;
        eventsContainer.appendChild(dot);
      });
    }

    // Open Modal Click Handler
    cell.addEventListener('click', () => {
      openSchedulerModal(dateKey, dateObj);
    });

    return cell;
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function openSchedulerModal(dateKey, dateObj) {
    eventDateStrInput.value = dateKey;
    
    // Nice header display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    modalDateTitle.innerText = dateObj.toLocaleDateString(undefined, options);

    // Load existing event to edit if any
    const existingEvents = scheduledEvents[dateKey] || [];
    if (existingEvents.length > 0) {
      const existing = existingEvents[0];
      eventTitleInput.value = existing.title;
      eventTypeInput.value = existing.type;
      // Restore custom label field if it was a custom type
      if (existing.type === 'custom') {
        customTypeGroup.style.display = 'block';
        customLabelInput.required = true;
        customLabelInput.value = existing.customLabel || '';
      } else {
        customTypeGroup.style.display = 'none';
        customLabelInput.required = false;
        customLabelInput.value = '';
      }
      deleteBtn.style.display = 'block';
    } else {
      eventTitleInput.value = '';
      eventTypeInput.value = 'exam';
      customTypeGroup.style.display = 'none';
      customLabelInput.required = false;
      customLabelInput.value = '';
      deleteBtn.style.display = 'none';
    }

    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  // Modal navigation / triggers
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Save Event
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedType = eventTypeInput.value;

    // Validate custom label is not empty when custom type is chosen
    if (selectedType === 'custom' && customLabelInput.value.trim() === '') {
      customLabelInput.style.borderColor = 'var(--danger-color)';
      customLabelInput.placeholder = 'Please enter a custom type name!';
      customLabelInput.focus();
      return;
    }
    customLabelInput.style.borderColor = '';

    const dateKey = eventDateStrInput.value;
    const newEvent = {
      title: eventTitleInput.value.trim(),
      type: selectedType,
      customLabel: selectedType === 'custom' ? customLabelInput.value.trim() : ''
    };

    // Save as array to allow multiple events per day in the future
    scheduledEvents[dateKey] = [newEvent];
    saveEvents();
    closeModal();
    renderCalendar();
  });

  // Clear Events for Day
  deleteBtn.addEventListener('click', () => {
    const dateKey = eventDateStrInput.value;
    if (scheduledEvents[dateKey]) {
      delete scheduledEvents[dateKey];
      saveEvents();
    }
    closeModal();
    renderCalendar();
  });

  // Month navigation buttons
  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Month and Year dropdown changes
  monthSelect.addEventListener('change', () => {
    currentDate.setMonth(parseInt(monthSelect.value));
    renderCalendar();
  });

  yearSelect.addEventListener('change', () => {
    currentDate.setFullYear(parseInt(yearSelect.value));
    renderCalendar();
  });

  renderCalendar();
}
