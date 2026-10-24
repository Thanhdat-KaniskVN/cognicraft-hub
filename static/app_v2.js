// 1. THEME TOGGLE
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
body.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
if(themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// 2. TYPING EFFECT (Dùng setInterval - Siêu ổn định)
document.addEventListener('DOMContentLoaded', () => {
    const out1 = document.getElementById('term-out-1');
    if (!out1) return; 

    const text1 = "First-year student, passionate about building systems. Sharing my self-development journey through a novel approach. Quite introverted but love helping others.";
    const text2 = "Building strong foundations in Math & Computer Science.";
    let i = 0, j = 0;

    const t1 = setInterval(() => {
        out1.innerHTML += text1.charAt(i);
        i++;
        if (i >= text1.length) {
            clearInterval(t1);
            document.getElementById('term-cmd-2').style.display = 'block';
            
            setTimeout(() => {
                const out2 = document.getElementById('term-out-2');
                const t2 = setInterval(() => {
                    out2.innerHTML += text2.charAt(j);
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

// 3. ROADMAP 3D
let globalGraph = null;
let globalData = null;
window.doCenter = function() { if(globalGraph) globalGraph.zoomToFit(1000, 50); };

document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('3d-graph');
    if (!graphContainer) return; 
    
    window.focusNode = function(id) {
        if (!globalGraph || !globalData) return;
        const node = globalData.nodes.find(n => n.id === id);
        if (!node) return;
        
        const distRatio = 1 + 120/Math.hypot(node.x, node.y, node.z || 1);
        globalGraph.cameraPosition({ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, node, 1000);

        document.getElementById('panel-title').textContent = node.name;
        document.getElementById('panel-desc').innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:0.5rem;">${node.desc || ''}</p> ${node.details || ''}`;
        
        const panelLinks = document.getElementById('panel-links'); 
        panelLinks.innerHTML = '';
        if (node.links) {
            node.links.forEach(link => { 
                panelLinks.innerHTML += `<a href="${link.url}" target="_blank">${link.title} <span style="background:var(--text-primary); color:var(--bg-base); padding:1px 4px; border-radius:2px; font-size:0.65rem;">${link.type}</span></a>`; 
            });
        }
        document.getElementById('detail-panel').classList.add('open');
    };

    setTimeout(() => {
        fetch('/api/roadmap').then(res => res.json()).then(gData => {
            globalData = gData;
            document.getElementById('graph-loading').remove();
            
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

            globalGraph = ForceGraph3D()(graphContainer)
                .width(graphContainer.clientWidth).height(graphContainer.clientHeight)
                .backgroundColor('rgba(0,0,0,0)').nodeRelSize(6) 
                .nodeVal(n => roots.includes(n.id) ? 4 : 1.5)
                .linkWidth(1)
                .linkColor(() => isDark() ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')
                .linkDirectionalParticles(1).linkDirectionalParticleSpeed(0.01).linkDirectionalParticleWidth(2)
                .nodeColor(n => isDark() ? (roots.includes(n.id) ? '#ffffff' : '#a1a1aa') : (roots.includes(n.id) ? '#000000' : '#52525b'))
                .nodeThreeObject(n => {
                    const sprite = new SpriteText(n.name);
                    sprite.color = isDark() ? (roots.includes(n.id) ? '#ffffff' : '#a1a1aa') : (roots.includes(n.id) ? '#000000' : '#52525b');
                    sprite.textHeight = roots.includes(n.id) ? 4 : 2.5;
                    sprite.fontFace = 'Inter'; sprite.fontWeight = roots.includes(n.id) ? '700' : '500';
                    return sprite;
                })
                .onNodeClick(n => window.focusNode(n.id));

            globalGraph.graphData(gData);
            globalGraph.d3Force('charge').strength(-100).d3Force('link').distance(40).d3Force('center').strength(0.1);
            
            const resizeGraph = () => {
                if (globalGraph) {
                    globalGraph.width(graphContainer.clientWidth).height(graphContainer.clientHeight);
                }
            };
            window.addEventListener('resize', resizeGraph);

            globalGraph.onEngineStop(() => {
                resizeGraph();
                globalGraph.zoomToFit(1000, 60);
            });
            
            setTimeout(() => {
                resizeGraph();
                globalGraph.zoomToFit(1000, 60);
            }, 2000);
        });
    }, 300);
});