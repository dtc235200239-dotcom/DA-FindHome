document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.querySelector(".menubtn");
    const sideMenu = document.getElementById("sideMenu");
    const toggleTheme = document.getElementById("toggleTheme");
    const btnHome = document.getElementById("btnHome");

    const boxes = document.querySelectorAll(".box");
    const tooltipItems = document.querySelectorAll(".item");

    if (toggleTheme) {
        const currentTheme = localStorage.getItem("theme");

        if (currentTheme === "dark") {
            document.body.classList.add("dark");
            toggleTheme.checked = true;
        }

        toggleTheme.addEventListener("change", function () {
            if (this.checked) {
                document.body.classList.add("dark");
                localStorage.setItem("theme", "dark");
            } else {
                document.body.classList.remove("dark");
                localStorage.setItem("theme", "light");
            }
        });
    }

    if (menuBtn && sideMenu) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isExpanded = menuBtn.getAttribute("aria-expanded") === "true";
            sideMenu.classList.toggle("show");
            menuBtn.setAttribute("aria-expanded", !isExpanded);
        });

        sideMenu.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("click", (e) => {
            if (sideMenu.classList.contains("show") && !menuBtn.contains(e.target)) {
                sideMenu.classList.remove("show");
                menuBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (btnHome) {
        btnHome.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });

            if (sideMenu) {
                sideMenu.classList.remove("show");
                if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (boxes.length > 0) {
        boxes.forEach(box => {
            box.addEventListener('mouseenter', () => {
                const popup = box.querySelector('.popup-info');
                if (popup) {
                    const boxRect = box.getBoundingClientRect();
                    const popupWidth = 250;
                    const windowWidth = window.innerWidth;

                    if (boxRect.right + popupWidth > windowWidth) {
                        popup.classList.add('show-left');
                    } else {
                        popup.classList.remove('show-left');
                    }
                }
            });
        });
    }

    if (tooltipItems.length > 0) {
        tooltipItems.forEach(item => {
            const tooltip = item.querySelector(".tooltip");

            if (!tooltip) return;

            item.addEventListener("click", (e) => {
                e.stopPropagation();

                // Ẩn tất cả tooltip khác
                document.querySelectorAll(".tooltip.show").forEach(t => {
                    if (t !== tooltip) t.classList.remove("show");
                });

                // Toggle tooltip hiện tại
                tooltip.classList.toggle("show");
            });
        });

        // Click ra ngoài thì ẩn tooltip
        document.addEventListener("click", () => {
            document.querySelectorAll(".tooltip.show").forEach(t => {
                t.classList.remove("show");
            });
        });
    }


});

