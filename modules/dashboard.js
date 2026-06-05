/* ==========================================================================
   AetherCatalog Dashboard & SVG Charts Module
   ========================================================================== */

import { DB } from './db.js';

// Color map for categories to keep styling consistent and beautiful
const CATEGORY_COLORS = {
  'Electronics': 'hsl(250, 95%, 70%)',      // Indigo
  'Office Gear': 'hsl(190, 95%, 55%)',      // Cyan
  'Media Equipment': 'hsl(38, 95%, 55%)',   // Amber
  'Laboratory': 'hsl(320, 95%, 65%)',        // Pink
  'default': 'hsl(215, 16%, 65%)'           // Slate
};

export const Dashboard = {
  // Main update call to refresh the entire dashboard screen
  updateDashboard() {
    const assets = DB.getAllAssets();
    const activities = DB.getActivities();
    
    this.renderStats(assets, activities);
    this.renderDonutChart(assets);
    this.renderValuationBars(assets);
    this.renderActivityTimeline(activities);
  },

  // Recalculates metrics and updates DOM nodes
  renderStats(assets, activities) {
    const totalAssetsEl = document.getElementById('stat-total-assets');
    const totalValueEl = document.getElementById('stat-total-value');
    const voiceEntriesEl = document.getElementById('stat-voice-entries');
    
    if (totalAssetsEl) totalAssetsEl.textContent = assets.length;
    
    // Portfolio valuation sum
    const totalVal = assets.reduce((sum, asset) => sum + parseFloat(asset.value || 0), 0);
    if (totalValueEl) {
      totalValueEl.textContent = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(totalVal);
    }
    
    // Count voice registrations
    const voiceCount = activities.filter(act => act.type === 'voice').length;
    if (voiceEntriesEl) voiceEntriesEl.textContent = voiceCount;
  },

  // Renders a fully interactive mathematical SVG donut chart
  renderDonutChart(assets) {
    const chartSvg = document.getElementById('category-donut-chart');
    const legendEl = document.getElementById('category-legend');
    const centerValEl = document.getElementById('donut-center-val');
    
    if (!chartSvg || !legendEl) return;
    
    // Clear previous SVG contents
    chartSvg.innerHTML = '';
    legendEl.innerHTML = '';
    
    if (centerValEl) centerValEl.textContent = assets.length;
    
    if (assets.length === 0) {
      chartSvg.innerHTML = `<circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10" />`;
      legendEl.innerHTML = '<span class="legend-item"><span class="legend-color" style="background-color: var(--text-muted)"></span>Empty Catalog</span>';
      return;
    }

    // Tally asset count per category
    const tallies = {};
    assets.forEach(asset => {
      const cat = asset.category || 'Uncategorized';
      tallies[cat] = (tallies[cat] || 0) + 1;
    });

    const categoryData = Object.entries(tallies).map(([name, count]) => ({
      name,
      count,
      percentage: (count / assets.length) * 100,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['default']
    }));

    // Draw SVG segments
    let accumulatedPercent = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius; // ~219.91

    categoryData.forEach(cat => {
      const strokeDash = `${(cat.count / assets.length) * circumference} ${circumference}`;
      const strokeOffset = `${- (accumulatedPercent / 100) * circumference}`;
      accumulatedPercent += cat.percentage;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'donut-segment');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', radius.toString());
      circle.setAttribute('stroke', cat.color);
      circle.setAttribute('stroke-dasharray', strokeDash);
      circle.setAttribute('stroke-dashoffset', strokeOffset);
      circle.setAttribute('style', `stroke-linecap: round; filter: drop-shadow(0 0 3px ${cat.color}40)`);
      
      // Interactive hover
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('stroke-width', '16px');
        if (centerValEl) {
          centerValEl.innerHTML = `${cat.count}<span style="font-size: 10px; display: block; color: ${cat.color}; font-weight:700;">${cat.name}</span>`;
        }
      });
      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('stroke-width', '14px');
        if (centerValEl) {
          centerValEl.innerHTML = `${assets.length}<span class="donut-sublabel">Assets</span>`;
        }
      });

      chartSvg.appendChild(circle);

      // Render legend item
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-color" style="background-color: ${cat.color}; box-shadow: 0 0 6px ${cat.color}60;"></span>
        <span style="font-weight: 600;">${cat.name} (${cat.count})</span>
      `;
      legendEl.appendChild(legendItem);
    });
  },

  // Renders relative category portfolio value distribution list
  renderValuationBars(assets) {
    const container = document.getElementById('valuation-bars');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (assets.length === 0) {
      container.innerHTML = '<p class="activity-time" style="text-align: center; padding: 20px 0;">No financial asset data available.</p>';
      return;
    }

    // Tally value per category
    const valuationMap = {};
    assets.forEach(asset => {
      const cat = asset.category || 'Uncategorized';
      valuationMap[cat] = (valuationMap[cat] || 0) + parseFloat(asset.value || 0);
    });

    const categoryVals = Object.entries(valuationMap).sort((a, b) => b[1] - a[1]);
    const maxVal = categoryVals.length > 0 ? categoryVals[0][1] : 1;

    categoryVals.forEach(([name, val]) => {
      const percentage = (val / maxVal) * 100;
      const formattedVal = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(val);
      
      const color = CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];

      const barRow = document.createElement('div');
      barRow.className = 'bar-row';
      barRow.innerHTML = `
        <div class="bar-meta">
          <span class="bar-name" style="font-weight: 700;">${name}</span>
          <span class="bar-value" style="color: ${color}; font-weight: 800;">${formattedVal}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: 0%; background: linear-gradient(90deg, ${color}, ${color}80);"></div>
        </div>
      `;

      container.appendChild(barRow);

      // Trigger width growth transition on next tick
      setTimeout(() => {
        const fill = barRow.querySelector('.bar-fill');
        if (fill) fill.style.width = `${percentage}%`;
      }, 50);
    });
  },

  // Renders timeline elements representing system operations
  renderActivityTimeline(activities) {
    const container = document.getElementById('activity-log-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (activities.length === 0) {
      container.innerHTML = '<p class="activity-time" style="text-align: center; padding: 20px 0;">Timeline empty. Perform tasks to log activities.</p>';
      return;
    }

    activities.forEach(act => {
      // Determine relative time wording
      const diffMs = Date.now() - new Date(act.time).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      
      let timeText = 'Just now';
      if (diffDays > 0) {
        timeText = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else if (diffHrs > 0) {
        timeText = `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins > 0) timeText = `${diffMins}m ago`;
      }

      const item = document.createElement('div');
      item.className = 'activity-item';
      
      let indicatorClass = '';
      if (act.type === 'voice') indicatorClass = 'mic';
      if (act.type === 'del') indicatorClass = 'del';

      item.innerHTML = `
        <div class="activity-dot-col">
          <div class="activity-indicator ${indicatorClass}"></div>
          <div class="activity-line-seg"></div>
        </div>
        <div class="activity-content">
          <div class="activity-desc">${act.desc}</div>
          <div class="activity-time">${timeText}</div>
        </div>
      `;

      container.appendChild(item);
    });
  }
};
export { CATEGORY_COLORS };
