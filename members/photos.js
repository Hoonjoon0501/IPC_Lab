const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.member-photo, .profile-photo').forEach(photo => {
    const fallback = photo.parentElement.querySelector('.photo-fallback');
    let revealed = false;

    function showFallback() {
        if (fallback) {
            photo.style.display = 'none';
            fallback.style.display = 'flex';
        }
    }

    async function reveal() {
        if (revealed) return;
        revealed = true;
        try {
            await photo.decode();
        } catch {
            showFallback();
            return;
        }

        photo.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
        if (!reducedMotion.matches && photo.animate) {
            photo.animate([{ opacity: 0 }, {}], {
                duration: 600,
                easing: 'ease-out'
            });
        }
    }

    photo.addEventListener('load', reveal, { once: true });
    photo.addEventListener('error', showFallback, { once: true });
    if (photo.complete) {
        if (photo.naturalWidth > 0) reveal();
        else showFallback();
    }
});
