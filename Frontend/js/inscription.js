var newsletterModal = document.getElementById("newsletterModal");
var newsletterModalBackdrop = document.getElementById("newsletterModalBackdrop");
var newsletterModalClose = document.getElementById("newsletterModalClose");
var newsletterForm = document.getElementById("newsletterForm");
var newsletterEmail = document.getElementById("email");
var newsletterStatus = document.getElementById("newsletterStatus");
var introOverlay = document.getElementById("introOverlay");

function setNewsletterStatus(message, isError) {
    if (!newsletterStatus) {
        return;
    }

    newsletterStatus.textContent = message;
    newsletterStatus.hidden = !message;
    newsletterStatus.classList.toggle("is-error", !!isError);
}

function openNewsletterModal() {
    if (!newsletterModal) {
        return;
    }

    newsletterModal.hidden = false;
    document.body.classList.add("newsletter-modal-open");
    setNewsletterStatus("", false);

    window.setTimeout(function () {
        if (newsletterEmail) {
            newsletterEmail.focus();
        }
    }, 30);
}

function closeNewsletterModal() {
    if (!newsletterModal) {
        return;
    }

    newsletterModal.hidden = true;
    document.body.classList.remove("newsletter-modal-open");
}

if (newsletterModalBackdrop) {
    newsletterModalBackdrop.addEventListener("click", closeNewsletterModal);
}

if (newsletterModalClose) {
    newsletterModalClose.addEventListener("click", closeNewsletterModal);
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && newsletterModal && !newsletterModal.hidden) {
        closeNewsletterModal();
    }
});

document.addEventListener("click", function (event) {
    if (!newsletterModal || !newsletterModal.hidden) {
        return;
    }

    if (introOverlay && !introOverlay.hasAttribute("hidden")) {
        return;
    }

    if (event.target.closest(".ft-nav, .newsletter-modal__dialog")) {
        return;
    }

    openNewsletterModal();
}, true);

if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!newsletterEmail) {
            return;
        }

        var email = newsletterEmail.value.trim();

        if (!email) {
            setNewsletterStatus("Please enter your email address.", true);
            newsletterEmail.focus();
            return;
        }

        setNewsletterStatus("Sending your registration...", false);

        fetch("https://funkthetown.net/api/signup", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                email: email
            }),
            mode: "cors",
            cache: "default"
        }).then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to subscribe right now.");
            }

            return response.json().catch(function () {
                return {};
            });
        }).then(function () {
            newsletterForm.reset();
            setNewsletterStatus("You are now on the list. See you soon on Funkthetown.", false);

            window.setTimeout(function () {
                closeNewsletterModal();
            }, 1200);
        }).catch(function (error) {
            setNewsletterStatus(error.message || "Subscription failed. Please try again.", true);
        });
    });
}
