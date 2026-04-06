// State variables
let projects = JSON.parse(localStorage.getItem('gajanand_projects')) || [];
let activeProjectId = null;
const PIPE_FEET = 6.562;

// Utility Setup
document.addEventListener('DOMContentLoaded', () => {
    // Handle splash screen auto-navigate
    setTimeout(() => {
        navigateTo('dashboard-screen');
        renderDashboard();
    }, 2000);

    // Set today's date in form
    document.getElementById('input-date').valueAsDate = new Date();

    // Event Listeners
    document.getElementById('add-project-form').addEventListener('submit', handleAddProject);
    document.getElementById('add-entry-form').addEventListener('submit', handleAddEntry);
});

// Navigation Engine
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('fade-out');
    });
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('fade-out');
        target.classList.add('active');
    }
}

// Toast System
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Dashboard Logic
function renderDashboard() {
    const list = document.getElementById('project-list');
    list.innerHTML = '';
    
    if(projects.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>No projects found. Add your first bore project!</p>
            </div>
        `;
        return;
    }

    projects.forEach(p => {
        const remaining = calculateRemaining(p);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="project-title">${p.partyName}</div>
            <div class="project-detail"><i class="fa-solid fa-location-dot"></i> ${p.villageName}</div>
            <div class="project-detail"><i class="fa-solid fa-arrows-up-down"></i> ${p.totalDepth} ft Target</div>
            <div class="project-detail"><i class="fa-regular fa-calendar"></i> ${p.date}</div>
            
            <div style="margin-top: 10px; background: #e0f2fe; padding: 8px; border-radius: 8px; font-size: 12px; color: #0284c7; font-weight: 600;">
                Remaining Depth: ${remaining} ft
            </div>
            
            <div class="card-actions">
                <button class="action-btn" onclick="openProject('${p.id}')" title="Open Project"><i class="fa-solid fa-folder-open"></i></button>
                <button class="action-btn delete" onclick="deleteProject('${p.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
}

function handleAddProject(e) {
    e.preventDefault();
    const partyName = document.getElementById('input-party').value;
    const villageName = document.getElementById('input-village').value;
    const totalDepth = parseFloat(document.getElementById('input-depth').value);
    
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    
    const newProject = {
        id: Date.now().toString(),
        partyName,
        villageName,
        totalDepth,
        date: dateStr,
        entries: []
    };
    
    projects.push(newProject);
    saveData();
    showToast('Project Created successfully');
    
    // reset form
    e.target.reset();
    document.getElementById('input-date').valueAsDate = new Date();
    
    openProject(newProject.id);
}

function deleteProject(id) {
    if(confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        saveData();
        renderDashboard();
        showToast('Project Deleted');
    }
}

// Project Work Logic
function openProject(id) {
    activeProjectId = id;
    const project = projects.find(p => p.id === id);
    if(!project) return;
    
    document.getElementById('work-title').textContent = project.partyName;
    document.getElementById('work-village').textContent = project.villageName;
    document.getElementById('work-target-depth').textContent = project.totalDepth + " ft";
    
    renderEntries();
    navigateTo('project-work-screen');
}

function handleAddEntry(e) {
    e.preventDefault();
    const project = projects.find(p => p.id === activeProjectId);
    if(!project) return;
    
    const pipeType = document.getElementById('pipe-type').value;
    const count = parseInt(document.getElementById('pipe-count').value);
    const feetUsed = parseFloat((count * PIPE_FEET).toFixed(2));
    
    project.entries.push({
        id: Date.now().toString(),
        pipeType,
        count,
        feetUsed
    });
    
    saveData();
    renderEntries();
    e.target.reset();
    showToast('Entry Added');
}

function deleteEntry(entryId) {
    const project = projects.find(p => p.id === activeProjectId);
    if(!project) return;
    
    project.entries = project.entries.filter(e => e.id !== entryId);
    saveData();
    renderEntries();
}

function renderEntries() {
    const project = projects.find(p => p.id === activeProjectId);
    const tbody = document.getElementById('entries-tbody');
    tbody.innerHTML = '';
    
    let currentRemaining = project.totalDepth;
    
    if(project.entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">No entries yet.</td></tr>';
        return;
    }
    
    project.entries.forEach((entry, index) => {
        currentRemaining = parseFloat((currentRemaining - entry.feetUsed).toFixed(2));
        const tr = document.createElement('tr');
        
        const badgeClass = entry.pipeType === 'Simple Pipe' ? 'badge-simple' : 'badge-slotted';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="badge ${badgeClass}">${entry.pipeType}</span></td>
            <td>${entry.count}</td>
            <td>${entry.feetUsed}</td>
            <td style="font-weight: 700; color: ${currentRemaining < 0 ? '#e63946' : 'var(--primary-blue)'}">${currentRemaining}</td>
            <td><button class="del-entry-btn" onclick="deleteEntry('${entry.id}')"><i class="fa-solid fa-xmark"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Calculations
function calculateRemaining(project) {
    let totalUsed = project.entries.reduce((sum, e) => sum + e.feetUsed, 0);
    return parseFloat((project.totalDepth - totalUsed).toFixed(2));
}

function saveData() {
    localStorage.setItem('gajanand_projects', JSON.stringify(projects));
}

// Report Logic
function showReport() {
    const project = projects.find(p => p.id === activeProjectId);
    if(!project) return;
    
    document.getElementById('report-date').textContent = project.date;
    document.getElementById('report-party').textContent = project.partyName;
    document.getElementById('report-village').textContent = project.villageName;
    document.getElementById('rep-target').textContent = project.totalDepth + " ft";
    
    let totalPipes = 0;
    let totalFeet = 0;
    let simpleCount = 0;
    let slottedCount = 0;
    
    project.entries.forEach(e => {
        totalPipes += e.count;
        totalFeet += e.feetUsed;
        if(e.pipeType === 'Simple Pipe') simpleCount += e.count;
        else slottedCount += e.count;
    });
    
    const remaining = parseFloat((project.totalDepth - totalFeet).toFixed(2));
    
    document.getElementById('rep-remaining').textContent = remaining + " ft";
    document.getElementById('rep-total-pipes').textContent = totalPipes;
    document.getElementById('rep-total-feet').textContent = parseFloat(totalFeet.toFixed(2)) + " ft";
    
    /* Build Visual Pipe Diagram */
    const container = document.getElementById('visual-pipe-container');
    container.innerHTML = '<div class="visual-pipe-label">WELL LOG</div>';
    
    if(project.entries.length === 0) {
        container.innerHTML += '<p style="font-size:12px; color:var(--text-muted)">No pipes inserted yet.</p>';
    } else {
        project.entries.forEach(e => {
            const el = document.createElement('div');
            el.className = 'pipe-segment';
            // Scale visual height roughly based on feet, bounded.
            const h = Math.max(20, Math.min(e.feetUsed * 0.8, 120)); 
            el.style.height = h + 'px';
            el.style.backgroundColor = e.pipeType === 'Simple Pipe' ? 'var(--light-green)' : 'var(--slotted-green)';
            el.innerHTML = `<span>${e.count}x<br>${e.pipeType.split(' ')[0]}</span>`;
            container.appendChild(el);
        });
    }

    navigateTo('report-screen');
}

// Exports
function downloadPDF() {
    const project = projects.find(p => p.id === activeProjectId);
    const element = document.getElementById('report-content-body');
    
    html2canvas(element, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        const filename = `${project.partyName.replace(/\s+/g, '_')}_${project.villageName.replace(/\s+/g, '_')}_BoreReport.pdf`;
        pdf.save(filename);
        showToast('PDF Downloaded');
    });
}

function shareWhatsApp() {
    const project = projects.find(p => p.id === activeProjectId);
    if(!project) return;
    
    let totalPipes = 0;
    let totalFeet = 0;
    project.entries.forEach(e => {
        totalPipes += e.count;
        totalFeet += e.feetUsed;
    });
    
    const remaining = parseFloat((project.totalDepth - totalFeet).toFixed(2));
    
    let text = `*💧 Gajanand Tubewell - Bore Report* 💧\n\n`;
    text += `*Party Name:* ${project.partyName}\n`;
    text += `*Village:* ${project.villageName}\n`;
    text += `*Date:* ${project.date}\n\n`;
    text += `🎯 *Target Depth:* ${project.totalDepth} ft\n`;
    text += `----------------------\n`;
    project.entries.forEach((e, i) => {
        text += `${i+1}. ${e.pipeType}: ${e.count} pipes (${e.feetUsed} ft)\n`;
    });
    text += `----------------------\n`;
    text += `📦 *Total Pipes:* ${totalPipes}\n`;
    text += `📏 *Total Used:* ${parseFloat(totalFeet.toFixed(2))} ft\n`;
    text += `🏁 *Final Remaining:* ${remaining} ft\n\n`;
    text += `Thank you for choosing Gajanand Tubewell!`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}
