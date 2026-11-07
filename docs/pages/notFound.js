/**
 * Mailgrant Designer 404 Page Component
 * Renders a cyber-neon zero-trust 404 screen with instant redirection to Dashboard.
 */

import { icon } from '../components/icons.js';
import { esc } from './common.js';

export function notFoundPage({ path = location.pathname } = {}) {
  const currentPath = path || location.pathname;

  return `
    <div class="designer-404-container">
      <div class="designer-404-card glass-neon-card">
        <div class="notfound-glow-ambient" aria-hidden="true"></div>
        
        <!-- Status Pill -->
        <div class="notfound-status-row">
          <div class="notfound-status-pill">
            <span class="notfound-pulse-dot" aria-hidden="true"></span>
            <span>BOUNDARY NOT FOUND · 404</span>
          </div>
          <span class="notfound-security-tag">${icon('shield')} Fail-Closed Policy</span>
        </div>

        <!-- Big Neon Holographic 404 Number -->
        <div class="notfound-hero-number" aria-hidden="true">
          <span class="number-glitch" data-text="404">404</span>
        </div>

        <!-- Headline & Explanatory Prose -->
        <h1 class="notfound-title">Outside Authorized Boundaries</h1>
        <p class="notfound-desc">
          The requested route, resource, or access key does not exist or has expired. In accordance with zero-trust principles, unmapped paths fail closed.
        </p>

        <!-- Cyber Telemetry Box -->
        <div class="notfound-telemetry-box">
          <div class="telemetry-item">
            <span class="telemetry-label">Attempted Path:</span>
            <code class="telemetry-code">${esc(currentPath)}</code>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Security Posture:</span>
            <span class="telemetry-status">STRICT_ISOLATION</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="notfound-actions-group">
          <a href="/" class="notfound-btn primary-glow">
            ${icon('shield')}
            <span>Return to Landing Page</span>
          </a>
        </div>

      </div>
    </div>
  `;
}

