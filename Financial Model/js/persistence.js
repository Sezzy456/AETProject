/**
 * Persistence logic.
 * Handles saving to and loading from storage (currently LocalStorage).
 */

export function saveProject(name, state) {
    const projects = JSON.parse(localStorage.getItem('financial_projects') || '{}');
    projects[name] = {
        name,
        timestamp: new Date().toISOString(),
        data: state
    };
    localStorage.setItem('financial_projects', JSON.stringify(projects));
    console.log(`Project "${name}" saved.`);
}

export function loadProject(name) {
    const projects = JSON.parse(localStorage.getItem('financial_projects') || '{}');
    return projects[name] ? projects[name].data : null;
}

export function getProjectList() {
    const projects = JSON.parse(localStorage.getItem('financial_projects') || '{}');
    return Object.keys(projects);
}
