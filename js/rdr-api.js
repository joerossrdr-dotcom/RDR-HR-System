/**
 * RDR API Layer — Shared across all pages
 * 
 * HOW IT WORKS:
 * Before (inside GAS iframe):  google.script.run.withSuccessHandler(fn).functionName(arg1, arg2)
 * After  (GitHub Pages):       callGAS('functionName', [arg1, arg2]).then(fn)
 *
 * This file provides callGAS() which sends fetch() requests to the GAS doPost endpoint.
 * The doPost endpoint uses a generic router that calls any function by name.
 */

// ============================================================================
// CONFIGURATION — reads from sessionStorage (set by rdr-auth.js on login)
// ============================================================================
var RDR_CONFIG = {
    get GAS_URL() { return sessionStorage.getItem('rdr_gas_url') || ''; },
    get SESSION_TOKEN() { return sessionStorage.getItem('rdr_session') || ''; },
    get USER_EMAIL() { return sessionStorage.getItem('rdr_email') || ''; },
    get BASE_URL() { return sessionStorage.getItem('rdr_gas_url') || ''; }
};

// ============================================================================
// callGAS — the universal API function
//
// Usage:
//   callGAS('dashboardGetEmployee', ['user@email.com'])
//     .then(function(result) { /* handle result */ })
//     .catch(function(err) { /* handle error */ });
//
// This replaces:
//   google.script.run.withSuccessHandler(fn).withFailureHandler(fn).dashboardGetEmployee('user@email.com')
// ============================================================================
function callGAS(functionName, args) {
    var gasUrl = RDR_CONFIG.GAS_URL;
    var session = RDR_CONFIG.SESSION_TOKEN;

    if (!gasUrl) {
        return Promise.reject(new Error('GAS URL not configured. Please re-login.'));
    }

    var payload = {
        action: '__call__',
        fn: functionName,
        args: args || [],
        session: session
    };

    return fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow'
    })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            // doPost wraps all results in { success, result, error }
            if (data && data.__error__) {
                throw new Error(data.__error__);
            }
            // Return the actual result (what the function returned)
            return data.__result__ !== undefined ? data.__result__ : data;
        });
}

// ============================================================================
// Convenience: callGAS with named action (for doPost actions like logAttendance)
// This is for backward compatibility with the kiosk's existing doPost actions.
// ============================================================================
function callGASAction(payload) {
    var gasUrl = RDR_CONFIG.GAS_URL;
    payload.session = RDR_CONFIG.SESSION_TOKEN;

    return fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow'
    })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
}
