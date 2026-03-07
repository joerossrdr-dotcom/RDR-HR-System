/**
 * RDR Auth — Session management for GitHub Pages
 *
 * HOW IT WORKS:
 * 1. User logs in via GAS (Google OAuth)
 * 2. GAS redirects to GitHub Pages with: ?gas=URL&session=TOKEN&email=EMAIL
 * 3. This script reads the URL params and stores them in sessionStorage
 * 4. sessionStorage is per-tab, so each kiosk/browser tab has its own session
 * 5. All pages read from sessionStorage via RDR_CONFIG (in rdr-api.js)
 *
 * WHY sessionStorage (not localStorage):
 * - sessionStorage is cleared when the tab/browser closes = auto-logout
 * - Different tabs can have different sessions (useful for testing)
 * - No risk of stale sessions persisting forever
 */

(function () {
    'use strict';

    // ── Read URL parameters (only present on first redirect from GAS) ──
    var params = new URLSearchParams(window.location.search);
    var gas = params.get('gas');
    var session = params.get('session');
    var email = params.get('email');

    // If URL has auth params, store them and clean up the URL
    if (gas && session) {
        sessionStorage.setItem('rdr_gas_url', gas);
        sessionStorage.setItem('rdr_session', session);
        if (email) sessionStorage.setItem('rdr_email', email);

        // Remove auth params from URL (so they don't leak in screenshots/bookmarks)
        var cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
    }

    // ── Verify we have a valid session ──
    var storedGas = sessionStorage.getItem('rdr_gas_url');
    var storedSession = sessionStorage.getItem('rdr_session');

    // Pages that don't require auth
    var publicPages = ['/signin.html', '/signin'];
    var isPublic = false;
    var path = window.location.pathname.toLowerCase();
    for (var i = 0; i < publicPages.length; i++) {
        if (path.endsWith(publicPages[i])) { isPublic = true; break; }
    }

    // ── Determine the base URL of our GitHub Pages site ──
    var repoBase = window.location.pathname.replace(/\/pages\/.*$/, '/').replace(/\/[^/]*\.html$/, '/');
    if (repoBase.charAt(repoBase.length - 1) !== '/') repoBase += '/';

    // If no session and not on a public page, redirect to sign in
    if (!storedGas && !storedSession && !isPublic) {
        window.location.href = repoBase + 'signin.html';
    }

    // ── Helper functions available globally ──
    window.RDR_AUTH = {
        getEmail: function () { return sessionStorage.getItem('rdr_email') || ''; },
        getSession: function () { return sessionStorage.getItem('rdr_session') || ''; },
        getGasUrl: function () { return sessionStorage.getItem('rdr_gas_url') || ''; },
        logout: function () {
            sessionStorage.clear();
            var base = window.location.pathname.replace(/\/pages\/.*$/, '/').replace(/\/[^/]*\.html$/, '/');
            if (base.charAt(base.length - 1) !== '/') base += '/';
            window.location.href = base + 'signin.html';
        },
        isLoggedIn: function () {
            return !!(sessionStorage.getItem('rdr_gas_url') && sessionStorage.getItem('rdr_session'));
        }
    };

    // ── Portal link helper ──
    // Usage: <a onclick="goToModule('dashboard')">
    window.goToModule = function (page) {
        var base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        // Handle pages/ subdirectory
        if (['leave', 'overtime', 'offset', 'holiday', 'cashadvance', 'wfh', 'wfhfiling',
            'fieldwork', 'approvals', 'admin', 'calendar', 'semimonthly', 'leavecredits',
            'dailyactivity', 'suspicious'].indexOf(page) !== -1) {
            window.location.href = base + 'pages/' + page + '.html';
        } else {
            window.location.href = base + page + '.html';
        }
    };

    // Navigate back to portal
    window.goHome = function () {
        var base = window.location.origin;
        // Determine if we're in /pages/ subdirectory
        if (window.location.pathname.indexOf('/pages/') !== -1) {
            window.location.href = base + window.location.pathname.replace(/\/pages\/.*$/, '/');
        } else {
            window.location.href = base + window.location.pathname.replace(/[^/]*$/, '');
        }
    };
})();
