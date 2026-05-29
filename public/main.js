let globalResults = [];
let barChart, donutChart;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchTreinos();

    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const parent = e.target.closest('.pills-container');
            parent.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });

    document.getElementById('refresh-btn').addEventListener('click', fetchTreinos);
});

function initCharts() {
    Chart.defaults.color = '#8B949E';
    Chart.defaults.borderColor = '#30363D';
    Chart.defaults.font.family = 'Inter, sans-serif';

    const ctxBar = document.getElementById('bar-chart').getContext('2d');
    const gradientBar = ctxBar.createLinearGradient(0, 0, 0, 240);
    gradientBar.addColorStop(0, '#2E8BFF');
    gradientBar.addColorStop(1, 'rgba(46, 139, 255, 0.10)');
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
            datasets: [{
                label: 'Treinos',
                data: [0,0,0,0,0,0,0,0,0,0,0,0],
                backgroundColor: gradientBar,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#23262F' } },
                x: { grid: { display: false } }
            }
        }
    });

    const ctxDonut = document.getElementById('donut-chart').getContext('2d');
    donutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['Técnica', 'Sparring', 'Seminário'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2E8BFF', '#19E3C2', '#7C5CFF'],
                borderWidth: 3,
                borderColor: '#13151B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { position: 'right', labels: { color: '#EDEFF4', boxWidth: 12, font: { size: 12, weight: '600' } } }
            }
        }
    });
}

function applyFilters() {
    if (!globalResults) return;

    const yearFilter = document.querySelector('#filter-year .pill.active').dataset.val;
    const monthFilter = document.querySelector('#filter-month .pill.active').dataset.val;
    const modalityFilter = document.querySelector('#filter-modality .pill.active').dataset.val;

    // 1. Determine target year for ANNUAL goals
    let targetYear = new Date().getFullYear();
    let yearGoalResults = globalResults;
    if (yearFilter !== 'Todos') {
        targetYear = parseInt(yearFilter, 10);
        yearGoalResults = globalResults.filter(page => {
            const dateStr = page.properties['Data']?.date?.start || '';
            return dateStr.startsWith(yearFilter);
        });
    } else {
        // Se "Todos" estiver selecionado, a métrica de Ritmo e Projeção foca no ano corrente.
        yearGoalResults = globalResults.filter(page => {
            const dateStr = page.properties['Data']?.date?.start || '';
            return dateStr.startsWith(targetYear.toString());
        });
    }

    updateAnnualGoalUI(yearGoalResults, targetYear);

    // 2. Filtra o resto da UI baseada nas escolhas exatas do usuário (tabela, gráficos, kpis)
    const filtered = globalResults.filter(page => {
        const props = page.properties;
        const dateStr = props['Data']?.date?.start || '';
        const mod = props['Modalidade']?.select?.name || '';
        
        let passYear = true;
        let passMonth = true;
        let passMod = true;

        if (yearFilter !== 'Todos') {
            passYear = dateStr.startsWith(yearFilter);
        }
        
        if (monthFilter !== 'Todos') {
            if (dateStr) {
                const parts = dateStr.split('-');
                if (parts.length >= 2 && parts[1] !== monthFilter) {
                    passMonth = false;
                }
            } else {
                passMonth = false;
            }
        }

        if (modalityFilter !== 'Todos') {
            passMod = mod === modalityFilter;
        }

        return passYear && passMonth && passMod;
    });

    updateFilteredUI(filtered);
}

function updateAnnualGoalUI(results, targetYear) {
    const goal = 130;
    const currentTotal = results.length;

    const percent = Math.round((currentTotal / goal) * 100);
    document.getElementById('goal-percent').innerText = `${percent}%`;
    document.getElementById('goal-text').innerText = `${currentTotal} / ${goal}`;

    const yearEl = document.getElementById('goal-year');
    if (yearEl) yearEl.innerText = String(targetYear);

    // Anel SVG: circunferência de r=90 → 2π·90 ≈ 565.48
    const CIRC = 565.48;
    const ringFill = document.getElementById('ring-progress');
    const ringExtra = document.getElementById('ring-progress-extra');
    const fraction = currentTotal / goal;

    if (ringFill) {
        if (fraction <= 1) {
            ringFill.style.strokeDashoffset = CIRC - (fraction * CIRC);
            if (ringExtra) ringExtra.style.display = 'none';
        } else {
            ringFill.style.strokeDashoffset = 0;
            if (ringExtra) {
                ringExtra.style.display = 'block';
                const extra = Math.min(1, fraction - 1);
                ringExtra.style.strokeDashoffset = CIRC - (extra * CIRC);
            }
        }
    }

    const now = new Date();
    let currentYear = now.getFullYear();
    let daysPassed, totalDaysInYear, remainingDays, remainingWeeks;

    const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    totalDaysInYear = isLeap(targetYear) ? 366 : 365;

    if (targetYear < currentYear) {
        daysPassed = totalDaysInYear;
        remainingWeeks = 0;
    } else if (targetYear > currentYear) {
        daysPassed = 0;
        remainingWeeks = 52.14;
    } else {
        const startOfYear = new Date(targetYear, 0, 1);
        const msPassed = now.getTime() - startOfYear.getTime();
        daysPassed = Math.max(1, Math.floor(msPassed / (1000 * 60 * 60 * 24)));
        remainingDays = totalDaysInYear - daysPassed;
        remainingWeeks = Math.max(0.1, remainingDays / 7);
    }

    const expectedToDate = (goal / totalDaysInYear) * daysPassed;
    const paceDiff = currentTotal - expectedToDate;

    const paceEl = document.getElementById('pace-status');
    const paceIcon = document.getElementById('pace-icon');
    if (paceDiff >= 1.5) {
        paceEl.innerText = `${Math.round(paceDiff)} treinos adiantado`;
        paceIcon.innerText = '🟢';
    } else if (paceDiff <= -1.5) {
        paceEl.innerText = `${Math.abs(Math.round(paceDiff))} treinos atrasado`;
        paceIcon.innerText = '🔴';
    } else {
        paceEl.innerText = `No ritmo!`;
        paceIcon.innerText = '🟡';
    }

    const projEl = document.getElementById('projection');
    const projBar = document.getElementById('proj-bar');
    if (daysPassed > 0) {
        const projection = (currentTotal / daysPassed) * totalDaysInYear;
        projEl.innerText = `${Math.round(projection)} treinos/ano`;
        
        let projFraction = projection / goal;
        let pColor = 'var(--danger)';
        if (projFraction >= 1) pColor = 'var(--teal)';
        else if (projFraction >= 0.9) pColor = 'var(--blue)';
        else if (projFraction >= 0.75) pColor = 'var(--warn)';

        if (projBar) {
            projBar.style.width = Math.min(100, Math.round(projFraction * 100)) + '%';
            projBar.style.backgroundColor = pColor;
        }
    } else {
        projEl.innerText = `-- treinos`;
        if (projBar) projBar.style.width = '0%';
    }

    const weeklyReqEl = document.getElementById('weekly-req');
    if (currentTotal >= goal) {
        weeklyReqEl.innerText = `Meta atingida! 🏆`;
    } else if (remainingWeeks > 0) {
        const reqWeekly = (goal - currentTotal) / remainingWeeks;
        weeklyReqEl.innerText = `${reqWeekly.toFixed(1)} treinos/semana`;
    } else {
        weeklyReqEl.innerText = `--`;
    }
}

function updateFilteredUI(results) {
    let total = results.length;
    let totalMinutes = 0;
    let highIntensity = 0;
    let giCount = 0;
    let nogiCount = 0;
    
    let monthCounts = [0,0,0,0,0,0,0,0,0,0,0,0];
    let typeCounts = { 'Técnica': 0, 'Sparring': 0, 'Seminário': 0 };

    if (total === 0) {
        document.getElementById('treinos-body').innerHTML = `
            <tr><td colspan="7" style="text-align:center; padding:48px; color: var(--text-muted);">
                <div style="font-size:28px; margin-bottom:12px;">🥋</div>
                <div>Nenhum treino registrado neste período. Hora de vestir o kimono!</div>
            </td></tr>`;
    } else {
        const rowsHTML = results.map(page => {
            const props = page.properties;
            const name = props['Treino']?.title?.[0]?.plain_text || 'Treino (Sem nome)';
            const dateStr = props['Data']?.date?.start || '';
            const dur = props['Duração (min)']?.number || 0;
            const mod = props['Modalidade']?.select?.name || '';
            const type = props['Tipo']?.select?.name || '';
            const int = props['Intensidade']?.select?.name || '';
            const focus = props['Foco do Treino']?.rich_text?.[0]?.plain_text || '--';
            
            totalMinutes += dur;
            if (int === 'Alta') highIntensity++;
            if (mod === 'Gi') giCount++;
            if (mod === 'No-Gi' || mod === 'No Gi') nogiCount++;
            
            if (typeCounts[type] !== undefined) typeCounts[type]++;
            else if (type) typeCounts[type] = 1;
            
            let formattedDate = '--';
            if (dateStr) {
                const dateObj = new Date(dateStr + "T00:00:00"); 
                monthCounts[dateObj.getMonth()]++;
                formattedDate = dateStr.split('-').reverse().join('/');
            }

            let modClass = mod === 'Gi' ? 'tag-blue' : (mod ? 'tag-red' : '');
            let modIcon = mod === 'Gi' ? '🔵 Gi' : (mod ? '🔴 No-Gi' : '');
            let typeClass = type === 'Técnica' ? 'tag-violet' : 'tag-grayblue';
            let intClass = int === 'Alta' ? 'text-danger' : 'text-teal';

            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td><strong>${name}</strong></td>
                    <td><span class="tag-pill ${modClass}">${modIcon || mod}</span></td>
                    <td><span class="tag-pill ${typeClass}">${type || '--'}</span></td>
                    <td>${dur ? dur + ' min' : '--'}</td>
                    <td class="${intClass}"><strong>${int || '--'}</strong></td>
                    <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${focus}</td>
                </tr>
            `;
        }).join('');
        document.getElementById('treinos-body').innerHTML = rowsHTML;
    }

    document.getElementById('kpi-total').innerText = total;
    let avg = total > 0 ? Math.round(totalMinutes / total) : 0;
    document.getElementById('kpi-avg-duration').innerHTML = `${avg} <span class="kpi-unit">min</span>`;
    document.getElementById('kpi-hours').innerText = (totalMinutes / 60).toFixed(1);
    document.getElementById('kpi-high-intensity').innerText = highIntensity;
    document.getElementById('kpi-gi').innerText = giCount;
    document.getElementById('kpi-nogi').innerText = nogiCount;

    barChart.data.datasets[0].data = monthCounts;
    barChart.update();
    
    let tec = typeCounts['Técnica'] || 0;
    let spa = (typeCounts['Sparring'] || 0) + (typeCounts['Sparring / Rolagem'] || 0); 
    let sem = typeCounts['Seminário'] || 0;
    donutChart.data.datasets[0].data = [tec, spa, sem];
    donutChart.update();

    document.getElementById('table-title').innerText = `TREINOS (${total} EXIBIDOS)`;
}

async function fetchTreinos() {
    const led = document.getElementById('sync-led');
    const statusText = document.getElementById('sync-status');
    if (led) led.className = 'led-dot led-teal';

    try {
        const resp = await fetch('/api/treinos');
        const data = await resp.json();

        if (data.fallback) {
            if (statusText) statusText.innerText = `⚠️ Modo Demonstração (Verifique .env)`;
            if (led) led.className = 'led-dot led-red';
            return;
        }

        if (data.results) {
            if (statusText) statusText.innerText = `✅ ${data.results.length} treinos carregados do Notion`;
            globalResults = data.results;
            applyFilters();
        }
    } catch (e) {
        console.error("Error fetching treinos:", e);
        if (statusText) statusText.innerText = `❌ Falha ao carregar dados do proxy local.`;
        if (led) led.className = 'led-dot led-red';
    }
}
