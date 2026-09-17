// initialization-scripts.js
// Moved from inline index.html to avoid 'unsafe-inline' CSP policy

(function () {
    // 1. Navbar Position Logic
    document.addEventListener('DOMContentLoaded', function () {
        try {
            var navbarPosition = localStorage.getItem('navbarPosition');
            var navbarVertical = document.querySelector('.navbar-vertical');
            var navbarTopVertical = document.querySelector('.content .navbar-top');
            var navbarTop = document.querySelector('[data-layout] .navbar-top:not([data-double-top-nav');
            var navbarDoubleTop = document.querySelector('[data-double-top-nav]');
            var navbarTopCombo = document.querySelector('.content [data-navbar-top="combo"]');

            if (localStorage.getItem('navbarPosition') === 'double-top') {
                document.documentElement.classList.toggle('double-top-nav-layout');
            }

            if (navbarPosition === 'top') {
                if (navbarTop) navbarTop.removeAttribute('style');
                if (navbarTopVertical) navbarTopVertical.remove();
                if (navbarVertical) navbarVertical.remove();
                if (navbarTopCombo) navbarTopCombo.remove();
                if (navbarDoubleTop) navbarDoubleTop.remove();
            } else if (navbarPosition === 'combo') {
                if (navbarVertical) navbarVertical.removeAttribute('style');
                if (navbarTopCombo) navbarTopCombo.removeAttribute('style');
                if (navbarTop) navbarTop.remove();
                if (navbarTopVertical) navbarTopVertical.remove();
                if (navbarDoubleTop) navbarDoubleTop.remove();
            } else if (navbarPosition === 'double-top') {
                if (navbarDoubleTop) navbarDoubleTop.removeAttribute('style');
                if (navbarTopVertical) navbarTopVertical.remove();
                if (navbarVertical) navbarVertical.remove();
                if (navbarTop) navbarTop.remove();
                if (navbarTopCombo) navbarTopCombo.remove();
            } else {
                if (navbarVertical) navbarVertical.removeAttribute('style');
                if (navbarTopVertical) navbarTopVertical.removeAttribute('style');
                if (navbarTop) navbarTop.remove();
                if (navbarDoubleTop) navbarDoubleTop.remove();
                if (navbarTopCombo) navbarTopCombo.remove();
            }
        } catch (e) {
            console.warn("Template script initialization skipped or partial", e);
        }
    });

    // 2. Fluid Layout Logic
    try {
        var isFluid = JSON.parse(localStorage.getItem('isFluid'));
        if (isFluid) {
            var container = document.querySelector('[data-layout]');
            if (container) {
                container.classList.remove('container');
                container.classList.add('container-fluid');
            }
        }
    } catch (e) { }

    // 3. RTL Logic
    try {
        var isRTL = JSON.parse(localStorage.getItem('isRTL'));
        if (isRTL) {
            var linkDefault = document.getElementById('style-default');
            var userLinkDefault = document.getElementById('user-style-default');
            if (linkDefault) linkDefault.setAttribute('disabled', true);
            if (userLinkDefault) userLinkDefault.setAttribute('disabled', true);
            document.querySelector('html').setAttribute('dir', 'rtl');
        } else {
            var linkRTL = document.getElementById('style-rtl');
            var userLinkRTL = document.getElementById('user-style-rtl');
            if (linkRTL) linkRTL.setAttribute('disabled', true);
            if (userLinkRTL) userLinkRTL.setAttribute('disabled', true);
        }
    } catch (e) { }
})();
