// 1. THEME TOGGLE
const themeToggles = document.querySelectorAll('.theme-toggle-btn, #theme-toggle');
const body = document.body;
body.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
});

// 2. TYPING EFFECT
document.addEventListener('DOMContentLoaded', () => {
    const out1 = document.getElementById('term-out-1');
    if (!out1) return; 
    const text1 = "First-year student, passionate about building systems. Sharing my self-development journey through a novel approach. Quite introverted but love helping others.";
    const text2 = "Building strong foundations in Math & Computer Science.";
    let i = 0, j = 0;
    const t1 = setInterval(() => {
        out1.textContent += text1.charAt(i);
        i++;
        if (i >= text1.length) {
            clearInterval(t1);
            document.getElementById('term-cmd-2').style.display = 'block';
            setTimeout(() => {
                const out2 = document.getElementById('term-out-2');
                const t2 = setInterval(() => {
                    out2.textContent += text2.charAt(j);
                    j++;
                    if (j >= text2.length) {
                        clearInterval(t2);
                        document.getElementById('term-cursor').style.display = 'block';
                    }
                }, 20);
            }, 500);
        }
    }, 20);
});

// 3. AOS INIT
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, easing: "ease-out-cubic", once: true, mirror: false, offset: 50 });
});

// 4. MOBILE MENU LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }
});

// 5. ROADMAP 3D & CAMERA & SEARCH LOGIC
window.globalGraph = null;
window.globalData = null;
window.doCenter = function() { if(window.globalGraph) window.globalGraph.zoomToFit(1000, 60); };

window.focusNode = function(id) {
    if (!window.globalGraph || !window.globalData) return;
    const node = window.globalData.nodes.find(n => n.id === id);
    if (!node) return;
    
    const dist = 120;
    if (node.x === undefined) {
        setTimeout(() => window.focusNode(id), 500);
        return;
    }

    const nodePos = { x: node.x, y: node.y, z: node.z };
    const camPos = window.globalGraph.cameraPosition();
    
    let dx = camPos.x - nodePos.x;
    let dy = camPos.y - nodePos.y;
    let dz = camPos.z - nodePos.z;
    let currentDist = Math.hypot(dx, dy, dz);
    if (currentDist === 0) { dx = 1; dy = 1; dz = 1; currentDist = Math.sqrt(3); }

    const ratio = dist / currentDist;
    window.globalGraph.cameraPosition(
        { x: nodePos.x + dx * ratio, y: nodePos.y + dy * ratio, z: nodePos.z + dz * ratio }, 
        nodePos, 
        1500 
    );

    const panelTitle = document.getElementById('panel-title');
    const panelDesc = document.getElementById('panel-desc');
    const panelLinks = document.getElementById('panel-links'); 
    if(panelTitle) panelTitle.textContent = node.name;
    if(panelDesc) panelDesc.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:0.5rem;">${node.desc || ''}</p> ${node.details || ''}`;
    if(panelLinks) {
        panelLinks.innerHTML = '';
        if (node.links) {
            node.links.forEach(link => { 
                panelLinks.innerHTML += `<a href="${link.url}" target="_blank">${link.title} <span style="background:var(--text-primary); color:var(--bg-base); padding:1px 4px; border-radius:2px; font-size:0.65rem;">${link.type}</span></a>`; 
            });
        }
    }
    const detailPanel = document.getElementById('detail-panel');
    if(detailPanel) detailPanel.classList.add('open');
};

document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('3d-graph');
    if (!graphContainer) return; 

    const getNodeColor = (id) => {
        if (['math', 'calc', 'linalg', 'prob', 'stats', 'discrete'].includes(id)) return '#3b82f6';
        if (['python', 'basic', 'oop', 'dsa', 'pandas'].includes(id)) return '#eab308';
        if (['sql', 'sql_basic', 'sql_join', 'sql_agg', 'sql_window'].includes(id)) return '#ef4444';
        if (['ds', 'eda', 'ml', 'dl', 'mlops'].includes(id)) return '#10a37f';
        return '#ffffff'; 
    };

    setTimeout(() => {
        fetch('/api/roadmap').then(res => res.json()).then(gData => {
            window.globalData = gData;
            const loader = document.getElementById('graph-loading');
            if (loader) loader.remove();
            
            const left = document.getElementById('tree-left'); 
            const right = document.getElementById('tree-right');
            const p12 = ['math', 'stats', 'python', 'sql']; 
            
            gData.nodes.forEach(node => {
                if (!gData.links.some(l => l.target === node.id)) { 
                    const isL = p12.includes(node.id); 
                    const c = isL ? left : right;
                    const p = document.createElement('div'); 
                    p.className = 'tree-item'; 
                    p.innerHTML = `<strong>${node.name}</strong>`; 
                    p.onclick = () => window.focusNode(node.id); 
                    c.appendChild(p);
                    
                    gData.links.filter(l => l.source === node.id).forEach(l => {
                        const ch = gData.nodes.find(n => n.id === l.target);
                        if(ch) { 
                            const cd = document.createElement('div'); 
                            cd.className = 'tree-item sub'; 
                            cd.innerHTML = `- ${ch.name}`; 
                            cd.onclick = () => window.focusNode(ch.id); 
                            c.appendChild(cd); 
                        }
                    });
                }
            });

            const isDark = () => body.getAttribute('data-theme') === 'dark';
            const roots = gData.nodes.filter(n => !gData.links.some(l => l.target === n.id)).map(n => n.id);

            window.globalGraph = ForceGraph3D()(graphContainer)
                .width(graphContainer.clientWidth).height(graphContainer.clientHeight)
                .backgroundColor('rgba(0,0,0,0)')
                .linkWidth(1)
                .linkColor(() => isDark() ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')
                .linkDirectionalParticles(1).linkDirectionalParticleSpeed(0.01).linkDirectionalParticleWidth(2)
                .nodeThreeObject(n => {
                    const sprite = new SpriteText(n.name);
                    sprite.color = getNodeColor(n.id);
                    sprite.textHeight = roots.includes(n.id) ? 25 : 15;
                    sprite.fontFace = 'Inter'; 
                    sprite.fontWeight = roots.includes(n.id) ? '700' : '500';
                    return sprite;
                })
                .onNodeClick(n => window.focusNode(n.id));

            window.globalGraph.graphData(gData);
            window.globalGraph.onEngineStop(() => { window.globalGraph.zoomToFit(1000, 60); });
            window.globalGraph.d3Force('charge').strength(-30).d3Force('link').distance(40).strength(1).d3Force('center').strength(1);
            
            const resizeGraph = () => {
                if (window.globalGraph) window.globalGraph.width(graphContainer.clientWidth).height(graphContainer.clientHeight);
            };
            window.addEventListener('resize', resizeGraph);

            setTimeout(() => { 
                resizeGraph(); 
                window.globalGraph.zoomToFit(1000, 60); 
            }, 1500);
            
        }).catch(err => console.error("Fetch data error:", err));
    }, 300);

    // MOBILE RESIZE FIX
    setTimeout(() => {
        if (window.innerWidth <= 1024) window.dispatchEvent(new Event('resize'));
    }, 1000);
});