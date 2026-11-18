// awatake ホームページ — 年齢自動計算・メニュー・スクロール演出・数字カウント

document.addEventListener('DOMContentLoaded', function () {

    /* ============================================================
       年齢と西暦の自動計算

       このサイトは年齢を手で書き換えなくて済むようにしてあります。
       生年月日が変わったときだけ、下の BIRTH を直してください。

         data-age          … 現在の満年齢を表示（例: 80）
         data-current-year … 現在の西暦を表示（例: 2026）
         data-count-age    … .stat-num に付けると、満年齢をカウントアップ表示
       ============================================================ */
    var BIRTH = { year: 1946, month: 11, day: 1 };

    /* 年齢の数え方
         'exact'    … 満年齢。誕生日（11月）が来るまでは79と表示されます（初期設定）
         'thisYear' … その年に迎える年齢。年明けから80と表示させたいときはこちら
       下の 'exact' を 'thisYear' に書き換えるだけで切り替わります。 */
    var AGE_MODE = 'exact';

    function calcAge() {
        var now = new Date();
        var age = now.getFullYear() - BIRTH.year;
        if (AGE_MODE === 'thisYear') { return age; }
        var month = now.getMonth() + 1;
        var beforeBirthday = month < BIRTH.month ||
            (month === BIRTH.month && now.getDate() < BIRTH.day);
        if (beforeBirthday) { age -= 1; }
        return age;
    }

    var currentAge = calcAge();
    var currentYear = new Date().getFullYear();

    document.querySelectorAll('[data-age]').forEach(function (el) {
        el.textContent = String(currentAge);
    });
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
        el.textContent = String(currentYear);
    });
    // カウントアップ演出つきの年齢（下の数字カウント処理が読む値を差し替える）
    document.querySelectorAll('[data-count-age]').forEach(function (el) {
        el.setAttribute('data-count', String(currentAge));
    });

    // ----- モバイルメニューの開閉 -----
    var menuToggle = document.querySelector('.menu-toggle');
    var navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function () {
            var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!expanded));
            navList.classList.toggle('active');
        });

        // メニュー項目を選んだら閉じる
        navList.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menuToggle.setAttribute('aria-expanded', 'false');
                navList.classList.remove('active');
            });
        });
    }

    // ----- スクロールでヘッダーに影をつける -----
    var header = document.getElementById('site-header') || document.querySelector('.site-header');
    if (header) {
        var onScroll = function () {
            header.classList.toggle('scrolled', window.scrollY > 10);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ----- スクロールに合わせてふわっと表示 -----
    var reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0 && 'IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        reveals.forEach(function (el, i) {
            el.style.transitionDelay = (i % 3) * 0.12 + 's';
            revealObserver.observe(el);
        });
    } else {
        reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    // ----- ヒーローの数字カウントアップ -----
    var counters = document.querySelectorAll('.stat-num[data-count]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function formatNum(value, target) {
        return target >= 1000 ? value.toLocaleString('ja-JP') : String(value);
    }

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) { return; }
        if (reduceMotion) {
            el.textContent = formatNum(target, target);
            return;
        }
        var duration = 1600;
        var start = null;
        function step(timestamp) {
            if (!start) { start = timestamp; }
            var progress = Math.min((timestamp - start) / duration, 1);
            // ゆっくり止まるイージング
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = formatNum(Math.round(target * eased), target);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    }

    // ----- 図解プロフィールのライトボックス（拡大表示） -----
    var zukaiOpen = document.getElementById('zukai-open');
    var zukaiLightbox = document.getElementById('zukai-lightbox');
    var zukaiClose = document.getElementById('zukai-close');

    if (zukaiOpen && zukaiLightbox && zukaiClose) {
        var openLightbox = function (e) {
            e.preventDefault();
            zukaiLightbox.hidden = false;
            document.body.style.overflow = 'hidden';
            zukaiClose.focus();
        };
        var closeLightbox = function () {
            zukaiLightbox.hidden = true;
            document.body.style.overflow = '';
            zukaiOpen.focus();
        };

        zukaiOpen.addEventListener('click', openLightbox);
        zukaiClose.addEventListener('click', closeLightbox);

        // 画像の外側（背景）をクリックしたら閉じる
        zukaiLightbox.addEventListener('click', function (e) {
            if (e.target === zukaiLightbox) {
                closeLightbox();
            }
        });

        // Escキーでも閉じる
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !zukaiLightbox.hidden) {
                closeLightbox();
            }
        });
    }

    if (counters.length > 0 && 'IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
        counters.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-count'), 10);
            if (!isNaN(target)) {
                el.textContent = formatNum(target, target);
            }
        });
    }
});
