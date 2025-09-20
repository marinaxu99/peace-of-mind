// Homepage navigation + niceties for Peace Of Mind

const supportBtn = document.getElementById('supportBtn');
const reflectBtn = document.getElementById('reflectBtn');
const resumeBtn = document.getElementById('resumeBtn');

function go(url) {
    // remember last destination
    try { localStorage.setItem('last_destination', url); } catch (e) { }
    window.location.href = url;
}

supportBtn?.addEventListener('click', () => go('support.html'));
reflectBtn?.addEventListener('click', () => go('reflect.html'));

resumeBtn?.addEventListener('click', () => {
    const last = localStorage.getItem('last_destination');
    go(last || 'support.html');
});

// Keyboard shortcuts: S → Support, R → Reflect
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 's') go('support.html');
    if (e.key.toLowerCase() === 'r') go('reflect.html');
});
