document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.shell-header');
    const toggle = document.querySelector('.shell-toggle');

    if (!header || !toggle) {
        return;
    }

    const setOpen = (open) => {
        header.dataset.open = open ? 'true' : 'false';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    setOpen(false);

    toggle.addEventListener('click', () => {
        setOpen(header.dataset.open !== 'true');
    });

    header.querySelectorAll('.shell-nav__link, .shell-cta').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1060) {
            setOpen(false);
        }
    });
});
