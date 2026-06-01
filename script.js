let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "All";
let currentSearch = "";
let cy = null;

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
    const title = $("#taskInput").val().trim();
    const category = $("#categoryInput").val();
    const priority = $("#priorityInput").val();
    const dueDate = $("#dateInput").val();

    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    const task = {
        id: Date.now(),
        title: title,
        category: category,
        priority: priority,
        dueDate: dueDate,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderApp();

    $("#taskInput").val("");
    $("#dateInput").val("");
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderApp();
}

function toggleComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    saveTasks();
    renderApp();
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    const updatedTitle = prompt("Edit task title:", task.title);

    if (updatedTitle === null) {
        return;
    }

    if (updatedTitle.trim() === "") {
        alert("Task title cannot be empty.");
        return;
    }

    task.title = updatedTitle.trim();
    saveTasks();
    renderApp();
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderApp();
}

function getFilteredTasks() {
    return tasks.filter(task => {
        const matchesFilter =
            currentFilter === "All" ||
            (currentFilter === "Completed" && task.completed) ||
            (currentFilter === "Pending" && !task.completed);

        const matchesSearch =
            task.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            task.category.toLowerCase().includes(currentSearch.toLowerCase()) ||
            task.priority.toLowerCase().includes(currentSearch.toLowerCase());

        return matchesFilter && matchesSearch;
    });
}

function renderTasks() {
    const taskList = $("#taskList");
    taskList.empty();

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        taskList.html(`
            <div class="empty-state">
                <h4>No tasks found</h4>
                <p>Add a new task or change your search/filter settings.</p>
            </div>
        `);
        return;
    }

    filteredTasks.forEach(task => {
        const taskCard = `
            <div class="task-card priority-${task.priority} ${task.completed ? "completed-task" : ""}">
                <div>
                    <h4>${task.title}</h4>

                    <div class="task-meta">
                        <span class="badge-custom badge-category">${task.category}</span>
                        <span class="badge-custom priority-badge-${task.priority}">${task.priority}</span>
                        <span class="badge-custom badge-date">${task.dueDate || "No due date"}</span>
                    </div>
                </div>

                <div class="task-actions">
                    <button class="action-btn" onclick="toggleComplete(${task.id})">
                        ${task.completed ? "Undo" : "Done"}
                    </button>

                    <button class="action-btn" onclick="editTask(${task.id})">
                        Edit
                    </button>

                    <button class="action-btn" onclick="deleteTask(${task.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;

        taskList.append(taskCard);
    });
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(task => task.priority === "High").length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    $("#totalTasks").text(total);
    $("#completedTasks").text(completed);
    $("#pendingTasks").text(pending);
    $("#highPriorityTasks").text(highPriority);

    $("#heroTotal").text(`${total} Tasks`);
    $("#heroProgress").css("width", `${progress}%`);
    $("#heroProgressText").text(`${progress}% completed`);
}

function renderGraph() {
    const categories = [...new Set(tasks.map(task => task.category))];

    const nodes = [
        { data: { id: "Tasks", label: "Tasks" } },
        ...categories.map(category => ({
            data: {
                id: category,
                label: category
            }
        })),
        ...tasks.map(task => ({
            data: {
                id: String(task.id),
                label: task.title
            }
        }))
    ];

    const edges = [
        ...categories.map(category => ({
            data: {
                id: `Tasks-${category}`,
                source: "Tasks",
                target: category
            }
        })),
        ...tasks.map(task => ({
            data: {
                id: `${task.category}-${task.id}`,
                source: task.category,
                target: String(task.id)
            }
        }))
    ];

    if (cy !== null) {
        cy.destroy();
    }

    cy = cytoscape({
        container: document.getElementById("cy"),
        elements: [...nodes, ...edges],
        style: [
            {
                selector: "node",
                style: {
                    "background-color": "#c9a86a",
                    "label": "data(label)",
                    "color": "#ffffff",
                    "text-outline-width": 2,
                    "text-outline-color": "#080808",
                    "font-size": "12px"
                }
            },
            {
                selector: "edge",
                style: {
                    "width": 2,
                    "line-color": "rgba(255,255,255,0.35)",
                    "target-arrow-color": "rgba(255,255,255,0.35)",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier"
                }
            }
        ],
        layout: {
            name: "breadthfirst",
            directed: true,
            padding: 25,
            spacingFactor: 1.4
        }
    });
}

function renderApp() {
    renderTasks();
    updateStats();
    renderGraph();
}

$(document).ready(function () {
    $("#addTaskBtn").on("click", addTask);

    $("#taskInput").on("keypress", function (event) {
        if (event.key === "Enter") {
            addTask();
        }
    });

    $("#searchInput").on("input", function () {
        currentSearch = $(this).val();
        renderTasks();
    });

    $("#filterInput").on("change", function () {
        currentFilter = $(this).val();
        renderTasks();
    });

    $("#clearCompletedBtn").on("click", clearCompletedTasks);

    renderApp();
});